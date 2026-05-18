"use client";

export function Kpis({ stats, rank, live }: {
  stats: { points: number; exact: number; picks: number };
  rank: number | null;
  live: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <Kpi label="Your points" value={stats.points} highlight="gold" />
      <Kpi label="Exact scores" value={stats.exact} highlight="pitch" />
      <Kpi label="Picks made" value={stats.picks} />
      <Kpi label="Pool rank" value={rank ? `#${rank}` : "—"} highlight={rank === 1 ? "gold" : undefined} />
      <Kpi label="Live now" value={live} highlight={live > 0 ? "live" : undefined} />
    </div>
  );
}

function Kpi({ label, value, highlight }: {
  label: string;
  value: string | number;
  highlight?: "gold" | "pitch" | "live";
}) {
  const cardClass = highlight === "gold" ? "card !p-3 relative overflow-hidden gold-border" : "card !p-3 relative overflow-hidden";
  const valueClass =
    highlight === "gold"  ? "scoreboard gold" :
    highlight === "pitch" ? "text-[var(--pitch-light)]" :
    highlight === "live"  ? "live-dot text-[var(--crimson)]" : "";

  return (
    <div className={cardClass}>
      {/* Top accent stripe for gold cards */}
      {highlight === "gold" && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-deep)]" />
      )}
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</div>
      <div className={"text-2xl font-extrabold mt-0.5 " + valueClass}>{value}</div>
    </div>
  );
}
