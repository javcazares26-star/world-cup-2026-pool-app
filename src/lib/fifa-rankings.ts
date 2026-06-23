// Approximate FIFA Men's World Ranking order (June 2026) for the teams in this
// pool. Lower number = higher-ranked = favored to win. Used to project the most
// probable knockout-bracket path. Edit freely to match the official ranking.
// Source for the top of the table: https://inside.fifa.com/fifa-world-ranking/men
export const FIFA_RANK: Record<string, number> = {
  "Argentina": 1,
  "Spain": 2,
  "France": 3,
  "England": 4,
  "Portugal": 5,
  "Brazil": 6,
  "Netherlands": 7,
  "Belgium": 8,
  "Germany": 9,
  "Croatia": 10,
  "Morocco": 11,
  "Colombia": 12,
  "Uruguay": 13,
  "USA": 14,
  "Switzerland": 15,
  "Mexico": 16,
  "Senegal": 17,
  "Japan": 18,
  "Iran": 19,
  "Ecuador": 20,
  "Austria": 21,
  "Rep. of Korea": 22,
  "Australia": 23,
  "Norway": 24,
  "Egypt": 25,
  "Turkey": 26,
  "Canada": 27,
  "Ivory Coast": 28,
  "Sweden": 29,
  "Paraguay": 30,
  "Qatar": 31,
  "Scotland": 32,
  "Tunisia": 33,
  "Saudi Arabia": 34,
  "Algeria": 35,
  "Czech Rep.": 36,
  "Uzbekistan": 37,
  "South Africa": 38,
  "Jordan": 39,
  "Panama": 40,
  "DR Congo": 41,
  "Iraq": 42,
  "Bosnia/Herzeg.": 43,
  "Cape Verde": 44,
  "New Zealand": 45,
  "Ghana": 46,
  "Curaçao": 47,
  "Haiti": 48,
};

/** Ranking for a team name; unknown teams rank last (largest number). */
export function rankOf(team: string | null | undefined): number {
  if (!team) return 999;
  return FIFA_RANK[team] ?? 999;
}
