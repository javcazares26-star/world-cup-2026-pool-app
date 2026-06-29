// Single source of truth for pick scoring, used by every client view.
// Keep this in sync with the v_pick_scores SQL view (migrations/penalty_outcome_scoring.sql).
//
// Rules:
//   • 3 pts — exact final score. For knockout games the final score INCLUDES
//     extra time (the synced score is API-Football's `goals`, i.e. after a.e.t.).
//   • 1 pt — correct outcome (right winner, or a draw in the group stage).
//       - For penalty-shootout games (status PEN), the "winner" is the shootout
//         winner, so predicting the correct side earns the outcome point even
//         though the 90'/a.e.t. scoreline is level.
//   • 0 pts — otherwise.
import type { Fixture } from "./types";

const FINISHED = ["FT", "AET", "PEN"];

export function isScored(f: Fixture): boolean {
  return (
    FINISHED.includes(f.status_short ?? "") &&
    f.home_score != null &&
    f.away_score != null
  );
}

export function isExactPick(homePick: number, awayPick: number, f: Fixture): boolean {
  return isScored(f) && homePick === f.home_score && awayPick === f.away_score;
}

/**
 * Score a pick against a raw scoreline. Used directly for the "Potential"
 * projection (which scores in-play matches as if final, so it ignores status).
 */
export function scoreLine(
  homePick: number,
  awayPick: number,
  homeScore: number | null,
  awayScore: number | null,
  statusShort?: string | null,
  homePenalty?: number | null,
  awayPenalty?: number | null,
): number {
  if (homeScore == null || awayScore == null) return 0;
  if (homePick === homeScore && awayPick === awayScore) return 3; // exact (incl. a.e.t.)
  if (statusShort === "PEN") {
    // Decided on penalties: outcome point if the predicted side matches the
    // shootout winner. If penalty scores weren't captured, no outcome point.
    if (homePenalty != null && awayPenalty != null) {
      return Math.sign(homePick - awayPick) === Math.sign(homePenalty - awayPenalty) ? 1 : 0;
    }
    return 0;
  }
  return Math.sign(homePick - awayPick) === Math.sign(homeScore - awayScore) ? 1 : 0;
}

/** Official points: only counts finished matches (FT/AET/PEN). */
export function pickPoints(homePick: number, awayPick: number, f: Fixture): number {
  if (!isScored(f)) return 0;
  return scoreLine(homePick, awayPick, f.home_score, f.away_score, f.status_short, f.home_penalty, f.away_penalty);
}

/** Projected points: scores whatever scoreline is present, finished or not. */
export function pickPointsProjected(homePick: number, awayPick: number, f: Fixture): number {
  return scoreLine(homePick, awayPick, f.home_score, f.away_score, f.status_short, f.home_penalty, f.away_penalty);
}
