"use client";

export function Kpis({ stats, rank, live }: {
  stats: { points: number; exact: number; picks: number };
  rank: number | null;
  live: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <Kpi label="Your points" value={stats.points} className="text-[#ffd23f]" />
      <Kpi label="Exact scores" value={stats.exact} className="text-[#06d6a0]" />
      <Kpi label="Picks made" value={stats.picks} />
      <Kpi label="Pool rank" value={rank ? `#${rank}` : "—"} />
      <Kpi label="Live now" value={live} live={live > 0} />
    </div>
  );
}

function Kpi({ label, value, className, live }: { label: string; value: string | number; className?: string; live?: boolean }) {
  return (
    <div className="card !p-3">
      <div className="text-[10px] uppercase tracking-wider text-[#9aa3c7]">{label}</div>
      <div className={"text-2xl font-extrabold mt-0.5 " + (className ?? "") + (live ? " live-dot text-[#ff4d6d]" : "")}>{value}</div>
    </div>
  );
}
