/**
 * Bracket Simulator: Predicts knockout stage matchups based on current picks
 *
 * World Cup 2026 Format:
 * - 12 groups (A-L) with 4 teams each = 48 teams
 * - Top 2 from each group + top 8 of 12 3rd place teams = 32 teams advance
 * - Qualified teams determined by predicted scores from current picks
 */

import type { Fixture, Pick } from "./types";

export interface GroupStanding {
  group: string;
  team: string;
  teamId?: number;
  logo?: string;
  plays: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: 1 | 2 | 3 | 4; // Final position in group
}

export interface QualifiedTeam {
  team: string;
  teamId?: number;
  logo?: string;
  group: string;
  position: 1 | 2 | 3; // 1st, 2nd, or 3rd place
  points: number;
  goalDifference: number;
}

export interface BracketMatch {
  id: string;
  round: string;
  matchId?: string;
  homeQualification: string; // e.g., "1A", "2B", "3C"
  awayQualification: string;
  homeTeam?: QualifiedTeam;
  awayTeam?: QualifiedTeam;
}

export interface SimulationResult {
  standings: Record<string, GroupStanding[]>; // groupLabel -> standings
  qualified: QualifiedTeam[]; // All 32 qualified teams
  bracketMatches: BracketMatch[]; // Knockout stage matchups
  lastUpdated: Date;
}

/**
 * Calculate points from a match outcome
 * 3 for exact, 1 for outcome, 0 for miss
 */
function calculatePoints(
  homePick: number,
  awayPick: number,
  homeActual: number | null,
  awayActual: number | null
): number {
  if (homeActual === null || awayActual === null) return 0;

  if (homePick === homeActual && awayPick === awayActual) {
    return 3; // Exact
  }

  const pickWinner = Math.sign(homePick - awayPick);
  const actualWinner = Math.sign(homeActual - awayActual);
  if (pickWinner === actualWinner && pickWinner !== 0) {
    return 1; // Outcome correct
  }

  return 0;
}

/**
 * Simulate group standings based on current picks
 */
function simulateGroupStandings(
  fixtures: Fixture[],
  picks: Pick[]
): Record<string, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};
  const groupTeams: Record<string, Set<string>> = {};

  // Group fixtures by group_label
  const groupFixtures = fixtures.filter(f => f.group_label && f.group_label !== "Other");

  groupFixtures.forEach(fixture => {
    const group = fixture.group_label!;
    if (!standings[group]) standings[group] = [];
    if (!groupTeams[group]) groupTeams[group] = new Set();

    groupTeams[group].add(fixture.home_team);
    groupTeams[group].add(fixture.away_team);
  });

  // Initialize standings for each team
  Object.entries(groupTeams).forEach(([group, teams]) => {
    teams.forEach(team => {
      if (!standings[group].find(s => s.team === team)) {
        standings[group].push({
          group,
          team,
          plays: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          position: 1,
        });
      }
    });
  });

  // Process each group fixture based on picks
  groupFixtures.forEach(fixture => {
    // Find any pick for this fixture (we use all picks, not just one user)
    // For simulation, we average picks or use the mode
    const picksForFixture = picks.filter(p => p.fixture_id === fixture.id);

    if (picksForFixture.length === 0) {
      // No picks yet, skip this fixture
      return;
    }

    // Use average of all picks as the predicted outcome
    const avgHome = Math.round(
      picksForFixture.reduce((sum, p) => sum + p.home_pick, 0) / picksForFixture.length
    );
    const avgAway = Math.round(
      picksForFixture.reduce((sum, p) => sum + p.away_pick, 0) / picksForFixture.length
    );

    const group = fixture.group_label!;
    const homeStanding = standings[group].find(s => s.team === fixture.home_team)!;
    const awayStanding = standings[group].find(s => s.team === fixture.away_team)!;

    homeStanding.plays++;
    awayStanding.plays++;
    homeStanding.goalsFor += avgHome;
    homeStanding.goalsAgainst += avgAway;
    awayStanding.goalsFor += avgAway;
    awayStanding.goalsAgainst += avgHome;

    if (avgHome > avgAway) {
      homeStanding.wins++;
      homeStanding.points += 3;
      awayStanding.losses++;
    } else if (avgAway > avgHome) {
      awayStanding.wins++;
      awayStanding.points += 3;
      homeStanding.losses++;
    } else {
      homeStanding.draws++;
      homeStanding.points += 1;
      awayStanding.draws++;
      awayStanding.points += 1;
    }

    homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
    awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;
  });

  // Sort each group by: points, goal difference, goals for
  Object.keys(standings).forEach(group => {
    standings[group].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Set final positions
    standings[group].forEach((team, idx) => {
      team.position = (idx + 1) as 1 | 2 | 3 | 4;
    });
  });

  return standings;
}

/**
 * Extract qualified teams from group standings
 * Returns top 2 from each group (32 teams total, as top 8 3rd place are determined later)
 */
function extractQualified(standings: Record<string, GroupStanding[]>): QualifiedTeam[] {
  const qualified: QualifiedTeam[] = [];
  const thirdPlace: QualifiedTeam[] = [];

  Object.entries(standings).forEach(([group, groupStandings]) => {
    // 1st place
    const first = groupStandings[0];
    qualified.push({
      team: first.team,
      teamId: first.teamId,
      logo: first.logo,
      group,
      position: 1,
      points: first.points,
      goalDifference: first.goalDifference,
    });

    // 2nd place
    const second = groupStandings[1];
    qualified.push({
      team: second.team,
      teamId: second.teamId,
      logo: second.logo,
      group,
      position: 2,
      points: second.points,
      goalDifference: second.goalDifference,
    });

    // 3rd place (for ranking later)
    const third = groupStandings[2];
    thirdPlace.push({
      team: third.team,
      teamId: third.teamId,
      logo: third.logo,
      group,
      position: 3,
      points: third.points,
      goalDifference: third.goalDifference,
    });
  });

  // Sort 3rd place teams and add top 8
  thirdPlace.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });

  qualified.push(...thirdPlace.slice(0, 8));

  return qualified;
}

/**
 * Generate knockout bracket based on qualified teams
 * Maps qualified teams to their bracket positions
 */
function generateBracket(qualified: QualifiedTeam[]): BracketMatch[] {
  // Create a map of qualification code to team
  const teamMap = new Map<string, QualifiedTeam>();

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  groups.forEach(group => {
    const first = qualified.find(q => q.group === group && q.position === 1);
    const second = qualified.find(q => q.group === group && q.position === 2);

    if (first) teamMap.set(`1${group}`, first);
    if (second) teamMap.set(`2${group}`, second);
  });

  // Add 3rd place teams (W49-W56 based on qualification code)
  let thirdPlaceIndex = 0;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(group => {
    const third = qualified.find(q => q.group === group && q.position === 3);
    if (third && thirdPlaceIndex < 8) {
      teamMap.set(`3${String.fromCharCode(87 + thirdPlaceIndex)}`, third); // 3W, 3X, 3Y, 3Z, etc.
      thirdPlaceIndex++;
    }
  });

  // Round of 32 bracket (first 32 matches of knockout stage)
  // Standard FIFA bracket: 1A vs 2B, 1B vs 2A, 1C vs 2D, etc.
  const bracketMatches: BracketMatch[] = [];

  const roundOf32Matchups = [
    ['1A', '2B'], ['1B', '2A'], ['1C', '2D'], ['1D', '2C'],
    ['1E', '2F'], ['1F', '2E'], ['1G', '2H'], ['1H', '2G'],
    ['1I', '2J'], ['1J', '2I'], ['1K', '2L'], ['1L', '2K'],
    // 3rd place teams
    ['3W', '2A'], // Placeholder - actual bracket determined by group results
  ];

  roundOf32Matchups.forEach((matchup, idx) => {
    bracketMatches.push({
      id: `ro32-${idx + 1}`,
      round: 'Round of 32',
      matchId: `M${idx + 1}`,
      homeQualification: matchup[0],
      awayQualification: matchup[1],
      homeTeam: teamMap.get(matchup[0]),
      awayTeam: teamMap.get(matchup[1]),
    });
  });

  // Note: Round of 16 and beyond would be filled in as matches are played
  // For now, we only show Round of 32 as the "bracket preview"

  return bracketMatches;
}

/**
 * Main simulation function
 */
export function simulateKnockoutStage(
  fixtures: Fixture[],
  picks: Pick[]
): SimulationResult {
  const standings = simulateGroupStandings(fixtures, picks);
  const qualified = extractQualified(standings);
  const bracketMatches = generateBracket(qualified);

  return {
    standings,
    qualified,
    bracketMatches,
    lastUpdated: new Date(),
  };
}

/**
 * Helper: Get qualified team by position code (e.g., "1A", "2B")
 */
export function getTeamByCode(
  code: string,
  qualified: QualifiedTeam[]
): QualifiedTeam | undefined {
  const match = code.match(/([123])([A-L])/);
  if (!match) return undefined;

  const [, position, group] = match;
  return qualified.find(
    q => q.group === group && q.position === parseInt(position) as 1 | 2 | 3
  );
}
