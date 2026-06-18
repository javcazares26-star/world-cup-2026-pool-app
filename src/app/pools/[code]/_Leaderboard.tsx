"use client";
import type { LeaderboardRow, Pool } from "@/lib/types";

export function Leaderboard({ rows, meId, pool }: { rows: LeaderboardRow[]; meId: string; pool: Pool }) {
  // Filter out hidden admin from leaderboard
  const visibleRows = rows.filter(r => !(r.user_id === pool.owner_id && pool.admin_hidden));

  // Calculate proper ranks accounting for ties
  const getProperRank = (index: number): number => {
    const currentPoints = visibleRows[index].points;
    // Count how many people have MORE points
    const betterCount = visibleRows.filter(r => r.points > currentPoints).length;
    return betterCount + 1;
  };

  return (
    <div className="card !p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Player</th>
            <th className="text-right p-3">Points</th>
            <th className="text-right p-3">Exact</th>
            <th className="text-right p-3">Correct</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 && (
            <tr><td colSpan={5} className="text-center text-[var(--muted)] p-6">No picks yet. Be the first!</td></tr>
          )}
          {visibleRows.map((r, i) => {
            const me = r.user_id === meId;
            const rank = getProperRank(i);
            const rankClass = rank === 1 ? "rank-gold"
              : rank === 2 ? "rank-silver"
              : rank === 3 ? "rank-bronze"
              : "bg-[var(--card-2)]";
            return (
              <tr key={r.user_id} className={"border-t border-[var(--border)] " + (me ? "bg-[rgba(244,196,48,0.08)]" : "")}>
                <td className="p-3">
                  <span className={"inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold " + rankClass}>{rank}</span>
                </td>
                <td className="p-3 flex items-center gap-2">
                  {r.avatar_url && <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                  <span className={me ? "font-bold" : ""}>{r.display_name}{me && " 👤"}</span>
                </td>
                <td className="p-3 text-right font-bold text-[var(--gold)]">{r.points}</td>
                <td className="p-3 text-right">
                  <span className="text-[var(--pitch-light)] font-semibold">{r.exact_count ?? 0}</span>
                  <span className="text-[10px] text-[var(--muted)] ml-1">×3</span>
                </td>
                <td className="p-3 text-right">
                  <span className="text-[var(--gold)] font-semibold">{r.correct_count ?? 0}</span>
                  <span className="text-[10px] text-[var(--muted)] ml-1">×1</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
