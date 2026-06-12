"use client";
import type { LeaderboardRow, Pool } from "@/lib/types";

export function Leaderboard({ rows, meId, pool }: { rows: LeaderboardRow[]; meId: string; pool: Pool }) {
  // Filter out hidden admin from leaderboard
  const visibleRows = rows.filter(r => !(r.user_id === pool.owner_id && pool.admin_hidden));

  return (
    <div className="card !p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Player</th>
            <th className="text-left p-3">Points</th>
            <th className="text-left p-3">Exact Score</th>
            <th className="text-left p-3">Match Points</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 && (
            <tr><td colSpan={5} className="text-center text-[var(--muted)] p-6">No picks yet. Be the first!</td></tr>
          )}
          {visibleRows.map((r, i) => {
            const me = r.user_id === meId;
            const rankClass = i === 0 ? "rank-gold"
              : i === 1 ? "rank-silver"
              : i === 2 ? "rank-bronze"
              : "bg-[var(--card-2)]";
            return (
              <tr key={r.user_id} className={"border-t border-[var(--border)] " + (me ? "bg-[rgba(244,196,48,0.08)]" : "")}>
                <td className="p-3">
                  <span className={"inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold " + rankClass}>{i + 1}</span>
                </td>
                <td className="p-3 flex items-center gap-2">
                  {r.avatar_url && <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                  <span className={me ? "font-bold" : ""}>{r.display_name}{me && " 👤"}</span>
                </td>
                <td className="p-3 font-bold text-[var(--gold)]">{r.points}</td>
                <td className="p-3 text-[var(--pitch-light)]">{r.exact_score}x3</td>
                <td className="p-3 text-[var(--muted)]">{r.match_points}x1</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
