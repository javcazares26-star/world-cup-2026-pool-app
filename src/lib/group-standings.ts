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
