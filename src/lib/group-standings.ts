/**
 * Group Stage Standings Calculator
 * Calculates team positions and points based on participant picks
 * Used for: Group finishers (1st, 2nd, 3rd) and 3rd place qualification ranking
 */

import type { Fixture, Pick } from "./types";

export type TeamStanding = {
  team: string;
  group: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  position?: 1 | 2 | 3; // Only set after sorting
};

export type GroupStandings = {
  group: string;
  teams: TeamStanding[];
};

/**
 * Calculate points from a single match pick vs actual result
 */
function calculateMatchPoints(
  homePick: number,
  awayPick: number,
  homeScore: number | null,
  awayScore: number | null
): number {
  if (homeScore === null || awayScore === null) return 0;

  // Exact score
  if (homePick === homeScore && awayPick === awayScore) return 3;

  // Correct outcome (same sign of difference)
  const pickDiff = Math.sign(homePick - awayPick);
  const actualDiff = Math.sign(homeScore - awayScore);
  if (pickDiff === actualDiff && pickDiff !== 0) return 1;

  return 0;
}

/**
 * Calculate standings for a single group based on all picks
 */
export function calculateGroupStandings(
  fixtures: Fixture[],
  picks: Pick[],
  group: string
): TeamStanding[] {
  // Get all group stage fixtures for this group
  const groupFixtures = fixtures.filter(
    (f) => f.group_label === group && f.status_short !== "NS"
  );

  // Track all teams in this group (from fixtures)
  const teamStats = new Map<string, TeamStanding>();

  // Initialize teams from fixtures
  groupFixtures.forEach((f) => {
    if (!teamStats.has(f.home_team)) {
      teamStats.set(f.home_team, {
        team: f.home_team,
        group,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      });
    }
    if (!teamStats.has(f.away_team)) {
      teamStats.set(f.away_team, {
        team: f.away_team,
        group,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      });
    }
  });

  // Calculate points and goals from all group fixtures
  groupFixtures.forEach((fixture) => {
    const homeTeam = teamStats.get(fixture.home_team)!;
    const awayTeam = teamStats.get(fixture.away_team)!;

    if (fixture.home_score !== null && fixture.away_score !== null) {
      // Update goal stats
      homeTeam.goalsFor += fixture.home_score;
      homeTeam.goalsAgainst += fixture.away_score;
      awayTeam.goalsFor += fixture.away_score;
      awayTeam.goalsAgainst += fixture.home_score;

      // Calculate points based on actual match result
      const homePoints = fixture.home_score > fixture.away_score ? 3 :
                        fixture.home_score === fixture.away_score ? 1 : 0;
      const awayPoints = fixture.away_score > fixture.home_score ? 3 :
                        fixture.away_score === fixture.home_score ? 1 : 0;

      homeTeam.points += homePoints;
      awayTeam.points += awayPoints;

      if (fixture.home_score > fixture.away_score) {
        homeTeam.wins++;
        awayTeam.losses++;
      } else if (fixture.away_score > fixture.home_score) {
        awayTeam.wins++;
        homeTeam.losses++;
      } else {
        homeTeam.draws++;
        awayTeam.draws++;
      }
    }
  });

  // Calculate goal difference and convert to array
  const standings = Array.from(teamStats.values()).map((team) => ({
    ...team,
    goalDifference: team.goalsFor - team.goalsAgainst,
  }));

  // Sort by: points (desc), goal difference (desc), goals for (desc)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Assign positions
  standings.forEach((team, idx) => {
    team.position = (idx + 1) as 1 | 2 | 3;
  });

  return standings;
}

/**
 * Get all group standings
 */
export function getAllGroupStandings(
  fixtures: Fixture[],
  picks: Pick[]
): GroupStandings[] {
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  return groups.map((group) => ({
    group,
    teams: calculateGroupStandings(fixtures, picks, `Group ${group}`),
  }));
}

/**
 * Get all 3rd place teams ranked by points (for qualification)
 */
export function getRanked3rdPlaceTeams(
  fixtures: Fixture[],
  picks: Pick[]
): TeamStanding[] {
  const allGroups = getAllGroupStandings(fixtures, picks);
  const thirdPlaceTeams = allGroups
    .map((g) => g.teams.find((t) => t.position === 3)!)
    .filter(Boolean);

  // Sort by: points (desc), goal difference (desc), goals for (desc)
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return thirdPlaceTeams;
}

/**
 * Get qualified 3rd place teams (top 8)
 */
export function getQualified3rdPlaceTeams(
  fixtures: Fixture[],
  picks: Pick[]
): TeamStanding[] {
  return getRanked3rdPlaceTeams(fixtures, picks).slice(0, 8);
}

/* ------------------------------------------------------------------ *
 * Knockout slot resolution
 * ------------------------------------------------------------------ *
 * Knockout fixtures carry "slot codes" instead of real team names
 * until the group stage determines who qualifies. Examples:
 *   "1A"      -> winner of Group A
 *   "2B"      -> runner-up of Group B
 *   "3-ABCDF" -> a qualifying 3rd-place team from one of groups A,B,C,D,F
 *   "W74"     -> winner of match 74 (resolved later, not by group position)
 *
 * This module resolves the group-position slots (1X / 2X / 3X / 3-XXXX)
 * into the real teams currently occupying those positions, based on the
 * live group standings computed from actual match results.
 */

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function groupLetter(standing: TeamStanding): string {
  // standing.group looks like "Group A"
  return (standing.group || "").replace(/^Group\s+/i, "").trim().toUpperCase();
}

/** True when a string is a group-position slot code rather than a real team name. */
export function isGroupSlot(code: string | null | undefined): boolean {
  if (!code) return false;
  return /^[123][A-L]$/.test(code) || /^3-[A-L]+$/i.test(code);
}

/** True when a string is any unresolved knockout placeholder (slot or W#/L#). */
export function isPlaceholder(code: string | null | undefined): boolean {
  if (!code) return true;
  if (code.toUpperCase() === "TBD") return true;
  if (isGroupSlot(code)) return true;
  return /^[WL]\d+$/i.test(code);
}

/**
 * Build a map of group-position slot codes -> real team names, using the
 * current (live) group standings. Only resolves slots we can determine now;
 * undeterminable slots are simply omitted from the map.
 */
export function resolveBracketSlots(
  fixtures: Fixture[],
  picks: Pick[]
): Record<string, string> {
  const resolved: Record<string, string> = {};

  // Per-group standings keyed by letter
  const byLetter: Record<string, TeamStanding[]> = {};
  for (const letter of GROUP_LETTERS) {
    byLetter[letter] = calculateGroupStandings(fixtures, picks, `Group ${letter}`);
  }

  // Direct 1X / 2X / 3X slots
  for (const letter of GROUP_LETTERS) {
    const s = byLetter[letter];
    if (s[0]) resolved[`1${letter}`] = s[0].team;
    if (s[1]) resolved[`2${letter}`] = s[1].team;
    if (s[2]) resolved[`3${letter}`] = s[2].team;
  }

  // Ranked, qualified 3rd-place teams (top 8 of the determined 3rd-placed teams)
  const thirds: TeamStanding[] = GROUP_LETTERS
    .map((l) => byLetter[l][2])
    .filter(Boolean) as TeamStanding[];
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  const qualifiedThirds = thirds.slice(0, 8);

  // Gather distinct "3-XXXX" combination slots that actually appear in the fixtures
  const comboSlots = new Set<string>();
  for (const f of fixtures) {
    for (const code of [f.qualified_team_home, f.qualified_team_away, f.home_team, f.away_team]) {
      if (code && /^3-[A-L]+$/i.test(code)) comboSlots.add(code.toUpperCase());
    }
  }

  if (comboSlots.size > 0 && qualifiedThirds.length > 0) {
    const slotList = Array.from(comboSlots).map((slot) => ({
      slot,
      allowed: new Set(slot.replace(/^3-/, "").split("")),
    }));

    // Maximum bipartite matching (Kuhn's algorithm): slots <-> qualified 3rd teams
    const teamLetters = qualifiedThirds.map((t) => groupLetter(t));
    const matchTeamToSlot: number[] = new Array(qualifiedThirds.length).fill(-1);

    const tryAssign = (slotIdx: number, seen: boolean[]): boolean => {
      for (let ti = 0; ti < qualifiedThirds.length; ti++) {
        if (slotList[slotIdx].allowed.has(teamLetters[ti]) && !seen[ti]) {
          seen[ti] = true;
          if (matchTeamToSlot[ti] === -1 || tryAssign(matchTeamToSlot[ti], seen)) {
            matchTeamToSlot[ti] = slotIdx;
            return true;
          }
        }
      }
      return false;
    };

    for (let si = 0; si < slotList.length; si++) {
      tryAssign(si, new Array(qualifiedThirds.length).fill(false));
    }

    for (let ti = 0; ti < qualifiedThirds.length; ti++) {
      const si = matchTeamToSlot[ti];
      if (si >= 0) resolved[slotList[si].slot] = qualifiedThirds[ti].team;
    }
  }

  return resolved;
}
