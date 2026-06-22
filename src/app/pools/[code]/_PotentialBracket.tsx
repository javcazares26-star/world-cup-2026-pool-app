"use client";
import type { Fixture, Pick } from "@/lib/types";
import { resolveBracketSlots, isPlaceholder, getQualified3rdPlaceTeams } from "@/lib/group-standings";
import { getTeamFlag } from "@/lib/team-flags";

type Props = {
  fixtures: Fixture[];
  picks?: Pick[];
};

/**
 * Potential Round of 32 — shows the real teams currently occupying each
 * qualifying position, mapped onto the actual R32 fixtures (correct venues,
 * dates, and FIFA bracket structure). Updates live as group results come in.
 */
export function PotentialBracket({ fixtures, picks = [] }: Props) {
  try {
    const resolved = resolveBracketSlots(fixtures, picks);

    // Real Round of 32 fixtures from the DB (correct matchups + venues)
    const r32 = fixtures
      .filter((f) => f.is_knockout && (f.round || "").toLowerCase().includes("round of 32"))
      .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

    // Group-stage progress
    const groupFixtures = fixtures.filter((f) => f.group_label && !f.is_knockout);
    const finishedCount = groupFixtures.filter((f) =>
      ["FT", "AET", "PEN"].includes(f.status_short || "")
    ).length;
    const totalCount = groupFixtures.length;

    // A slot is a 3rd-place placeholder if it starts with "3" (e.g. "3A", "3-ABCDF").
    const slotOf = (realName: string, slotCode: string | null): string | null =>
      slotCode || (isPlaceholder(realName) ? realName : null);
    const isThirdSlot = (slot: string | null): boolean => !!slot && /^3/.test(slot.trim());

    // Assign the qualified top-8 third-place teams (the SAME list, in the SAME
    // order, as the 3rd Place Standings table) to the R32 third-place slots —
    // each team exactly once, in match order. This keeps the bracket consistent
    // with the standings and prevents a team appearing in two matches.
    const qualThirds = getQualified3rdPlaceTeams(fixtures, picks).map((t) => t.team);
    const thirdAssign: Record<string, string> = {}; // `${fixtureId}:home|away` -> team
    let ti = 0;
    for (const f of r32) {
      if (isThirdSlot(slotOf(f.home_team, f.qualified_team_home)) && ti < qualThirds.length) {
        thirdAssign[`${f.id}:home`] = qualThirds[ti++];
      }
      if (isThirdSlot(slotOf(f.away_team, f.qualified_team_away)) && ti < qualThirds.length) {
        thirdAssign[`${f.id}:away`] = qualThirds[ti++];
      }
    }

    // Resolve one side of a fixture into { label, team }
    const side = (realName: string, slotCode: string | null, key: string) => {
      // If the real team is already determined, use it
      if (!isPlaceholder(realName)) {
        return { label: slotCode && slotCode !== realName ? slotCode : null, team: realName };
      }
      const slot = slotCode || realName;
      // 3rd-place slots are assigned from the ordered qualified-thirds list above
      if (isThirdSlot(slot)) {
        return { label: slot, team: thirdAssign[key] ?? null };
      }
      const team = resolved[(slot || "").toUpperCase()] || resolved[slot] || null;
      return { label: slot, team };
    };

    if (r32.length === 0) {
      return (
        <div className="mb-6 card !p-4 border-l-4" style={{ borderLeftColor: "var(--gold)" }}>
          <div className="text-sm text-[var(--muted)]">
            🏆 Round of 32 fixtures haven&apos;t loaded yet. They&apos;ll appear here as soon as
            the knockout schedule syncs.
          </div>
        </div>
      );
    }

    const resolvedSlotCount = r32.reduce((n, f) => {
      const h = side(f.home_team, f.qualified_team_home, `${f.id}:home`);
      const a = side(f.away_team, f.qualified_team_away, `${f.id}:away`);
      return n + (h.team ? 1 : 0) + (a.team ? 1 : 0);
    }, 0);

    return (
      <div className="mb-6">
        <div className="card !p-0 overflow-hidden border-2 border-[var(--gold)] border-opacity-30">
          <div className="group-banner px-4 py-3 border-b-2 border-[var(--gold)] bg-opacity-10 text-sm font-bold text-[var(--gold)] flex items-center justify-between gap-2 flex-wrap">
            <span>⚡ Projected Round of 32 — based on current group positions</span>
            <span className="text-xs font-normal text-[var(--muted)]">
              {finishedCount} / {totalCount} group matches played · {resolvedSlotCount}/{r32.length * 2} slots filled
            </span>
          </div>

          {finishedCount < totalCount && (
            <div className="px-4 py-3 bg-[var(--card-2)] border-b border-[var(--border)] text-xs text-[var(--muted)]">
              💡 These matchups update live as group results come in. Teams shown reflect who sits
              in each qualifying position <strong>right now</strong>; a code (e.g. <em>1A</em>,
              <em> 3-ABCDF</em>) means that spot isn&apos;t decided yet.
            </div>
          )}

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {r32.map((f) => {
              const h = side(f.home_team, f.qualified_team_home, `${f.id}:home`);
              const a = side(f.away_team, f.qualified_team_away, `${f.id}:away`);
              const ready = !!h.team && !!a.team;
              const date = new Date(f.kickoff_utc).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              const Team = ({ label, team }: { label: string | null; team: string | null }) => (
                <div className="text-center">
                  {label && (
                    <div className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                      {label}
                    </div>
                  )}
                  <div
                    className={`text-sm font-bold flex items-center justify-center gap-1.5 ${
                      team ? "text-[var(--text)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {team && <span className="text-base">{getTeamFlag(team)}</span>}
                    <span>{team ?? label ?? "—"}</span>
                  </div>
                </div>
              );

              return (
                <div
                  key={f.id}
                  className={`rounded-lg border-2 p-3 transition-colors ${
                    ready
                      ? "border-[var(--gold)] bg-[var(--card-2)]"
                      : "border-[var(--border)] bg-[var(--card-3)] opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[var(--gold)]">
                      {f.match_id || "R32"}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">{date}</span>
                  </div>

                  <Team label={h.label} team={h.team} />
                  <div className="text-center text-[10px] text-[var(--muted)] my-1">vs</div>
                  <Team label={a.label} team={a.team} />

                  {f.city && (
                    <div className="text-center text-[10px] text-[var(--muted)] mt-2 pt-2 border-t border-[var(--border)]">
                      📍 {f.city}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-[var(--card-3)] border-t border-[var(--border)] text-xs text-[var(--muted)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-semibold">
              <div>🥇 <span className="text-[var(--text)]">1A–1L</span> = Group winners</div>
              <div>🥈 <span className="text-[var(--text)]">2A–2L</span> = Runners-up</div>
              <div>🥉 <span className="text-[var(--text)]">3-…</span> = Best 3rd-place teams</div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("PotentialBracket error:", error);
    return (
      <div className="mb-6 card !p-4 border-l-4" style={{ borderLeftColor: "var(--crimson)" }}>
        <div className="text-sm text-[var(--muted)]">
          ⚠️ Projected bracket is loading. Check back in a moment.
        </div>
      </div>
    );
  }
}
