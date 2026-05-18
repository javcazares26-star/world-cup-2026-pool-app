"use client";
import type { LeaderboardRow } from "@/lib/types";

export function Leaderboard({ rows, meId }: { rows: LeaderboardRow[]; meId: string }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-[#9aa3c7]">
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Player</th>
            <th className="text-left p-3">Points</th>
            <th className="text-left p-3">Exact</th>
            <th className="text-left p-3">Picks</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="text-center text-[#9aa3c7] p-6">No picks yet. Be the first!</td></tr>
          )}
          {rows.map((r, i) => {
            const me = r.user_id === meId;
            const rankClass = i === 0 ? "rank-gold"
              : i === 1 ? "rank-silver"
              : i === 2 ? "rank-bronze"
              : "bg-[var(--card-2)]";
            return (
              <tr key={r.user_id} className={"border-t border-[#2a3566] " + (me ? "bg-[rgba(255,210,63,0.08)]" : "")}>
                <td className="p-3">
                  <span className={"inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold " + rankClass}>{i + 1}</span>
                </td>
                <td className="p-3 flex items-center gap-2">
                  {r.avatar_url && <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full" />}
                  <span className={me ? "font-bold" : ""}>{r.display_name}{me && " 👤"}</span>
                </td>
                <td className="p-3 font-bold text-[#ffd23f]">{r.points}</td>
                <td className="p-3">{r.exact_count}</td>
                <td className="p-3 text-[#9aa3c7]">{r.picks_made}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
