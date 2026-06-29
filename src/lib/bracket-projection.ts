// Projects the full knockout bracket (R32 → Final) from current group positions
// and FIFA ranking. For each match: if it's already finished, the real winner
// advances; otherwise the higher-FIFA-ranked team is projected to advance.
//
// Seeded fixture ids encode the FIFA match number: id 9000NN = match NN
// (matches 73-104 are the knockout stage). Slots like "W74" mean "winner of
// match 74", "L101" means "loser of match 101" (third-place game).
import type { Fixture, Pick } from "./types";
import { resolveR32Teams, isPlaceholder } from "./group-standings";
import { rankOf } from "./fifa-rankings";

const FINISHED = ["FT", "AET", "PEN"];

export function projectKnockout(
  fixtures: Fixture[],
  picks: Pick[],
  opts?: { determinedOnly?: boolean }
): Record<number, { home: string | null; away: string | null }> {
  const determinedOnly = opts?.determinedOnly ?? false;
  const r32 = resolveR32Teams(fixtures, picks);

  // Index knockout fixtures by their FIFA match number (id - 900000)
  const byNum = new Map<number, Fixture>();
  for (const f of fixtures) {
    if (f.is_knockout) byNum.set(f.id - 900000, f);
  }

  const teamsCache = new Map<number, { home: string | null; away: string | null }>();
  const winnerCache = new Map<number, string | null>();

  const resolveSlot = (slot: string | null, realName: string): string | null => {
    if (!isPlaceholder(realName)) return realName; // already a real team
    // The Wnn/Lnn reference may live in either the qualified_team code or the
    // team-name field, so check both.
    for (const candidate of [slot, realName]) {
      const s = (candidate || "").trim();
      const w = s.match(/^W(\d+)$/i);
      if (w) return winnerOf(parseInt(w[1], 10));
      const l = s.match(/^L(\d+)$/i);
      if (l) return loserOf(parseInt(l[1], 10));
    }
    return null; // group-position slots only resolve via the R32 map
  };

  function teamsOf(num: number): { home: string | null; away: string | null } {
    const cached = teamsCache.get(num);
    if (cached) return cached;
    teamsCache.set(num, { home: null, away: null }); // cycle guard (bracket is acyclic anyway)

    const f = byNum.get(num);
    let res: { home: string | null; away: string | null };
    if (!f) {
      res = { home: null, away: null };
    } else if (num >= 73 && num <= 88 && r32[f.id]) {
      // Round of 32: from group standings, but prefer real teams once determined
      res = {
        home: !isPlaceholder(f.home_team) ? f.home_team : r32[f.id].home,
        away: !isPlaceholder(f.away_team) ? f.away_team : r32[f.id].away,
      };
    } else {
      res = {
        home: resolveSlot(f.qualified_team_home, f.home_team),
        away: resolveSlot(f.qualified_team_away, f.away_team),
      };
    }
    teamsCache.set(num, res);
    return res;
  }

  function winnerOf(num: number): string | null {
    const cached = winnerCache.get(num);
    if (cached !== undefined) return cached;
    winnerCache.set(num, null);

    const f = byNum.get(num);
    const { home, away } = teamsOf(num);
    let win: string | null;
    if (home && away) {
      const finished =
        f && FINISHED.includes(f.status_short ?? "") &&
        f.home_score != null && f.away_score != null && f.home_score !== f.away_score;
      if (finished) win = (f!.home_score as number) > (f!.away_score as number) ? home : away;
      else if (determinedOnly) win = null; // only certain results, no rank guessing
      else win = rankOf(home) <= rankOf(away) ? home : away; // favorite by ranking
    } else {
      win = home || away || null;
    }
    winnerCache.set(num, win);
    return win;
  }

  function loserOf(num: number): string | null {
    const { home, away } = teamsOf(num);
    if (!home || !away) return null;
    return winnerOf(num) === home ? away : home;
  }

  const out: Record<number, { home: string | null; away: string | null }> = {};
  for (const f of fixtures) {
    if (f.is_knockout) out[f.id] = teamsOf(f.id - 900000);
  }
  return out;
}
