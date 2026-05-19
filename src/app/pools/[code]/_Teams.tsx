"use client";
import { useEffect, useMemo, useState } from "react";
import type { Fixture } from "@/lib/types";

type Player = {
  id: string;
  name: string;
  position: string | null;
  cutout: string | null;
  number?: string | null;
};

type TeamMeta = {
  group: string;
  team: string;
  flag: string;
  searchName: string;     // name used to search TheSportsDB
  sportsdbId?: string;    // optional known TheSportsDB id (bypasses search ambiguity)
};

/* ===========================================================================
 * Canonical 48-team roster for the 2026 World Cup.
 * Hardcoded so the Teams tab works even if the fixtures table hasn't fully synced.
 * Group letters and team names match the official December 2025 draw.
 *
 * sportsdbId fields are TheSportsDB's idTeam for the national team. When present,
 * we skip search and look up directly — eliminates ambiguity. Add as you verify.
 * =========================================================================== */
const ALL_TEAMS: TeamMeta[] = [
  // ===== Group A =====
  { group: "Group A", team: "Mexico",         flag: "🇲🇽", searchName: "Mexico", sportsdbId: "133713" },
  { group: "Group A", team: "South Africa",   flag: "🇿🇦", searchName: "South Africa" },
  { group: "Group A", team: "Rep. of Korea",  flag: "🇰🇷", searchName: "South Korea" },
  { group: "Group A", team: "Czech Rep.",     flag: "🇨🇿", searchName: "Czech Republic" },

  // ===== Group B =====
  { group: "Group B", team: "Canada",         flag: "🇨🇦", searchName: "Canada" },
  { group: "Group B", team: "Bosnia/Herzeg.", flag: "🇧🇦", searchName: "Bosnia and Herzegovina" },
  { group: "Group B", team: "Qatar",          flag: "🇶🇦", searchName: "Qatar" },
  { group: "Group B", team: "Switzerland",    flag: "🇨🇭", searchName: "Switzerland" },

  // ===== Group C =====
  { group: "Group C", team: "Brazil",         flag: "🇧🇷", searchName: "Brazil",      sportsdbId: "133706" },
  { group: "Group C", team: "Morocco",        flag: "🇲🇦", searchName: "Morocco" },
  { group: "Group C", team: "Haiti",          flag: "🇭🇹", searchName: "Haiti" },
  { group: "Group C", team: "Scotland",       flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", searchName: "Scotland" },

  // ===== Group D =====
  { group: "Group D", team: "USA",            flag: "🇺🇸", searchName: "United States", sportsdbId: "133731" },
  { group: "Group D", team: "Paraguay",       flag: "🇵🇾", searchName: "Paraguay" },
  { group: "Group D", team: "Australia",      flag: "🇦🇺", searchName: "Australia" },
  { group: "Group D", team: "Turkey",         flag: "🇹🇷", searchName: "Turkey" },

  // ===== Group E =====
  { group: "Group E", team: "Germany",        flag: "🇩🇪", searchName: "Germany",     sportsdbId: "133673" },
  { group: "Group E", team: "Curaçao",        flag: "🇨🇼", searchName: "Curacao" },
  { group: "Group E", team: "Ivory Coast",    flag: "🇨🇮", searchName: "Ivory Coast" },
  { group: "Group E", team: "Ecuador",        flag: "🇪🇨", searchName: "Ecuador" },

  // ===== Group F =====
  { group: "Group F", team: "Netherlands",    flag: "🇳🇱", searchName: "Netherlands" },
  { group: "Group F", team: "Japan",          flag: "🇯🇵", searchName: "Japan" },
  { group: "Group F", team: "Sweden",         flag: "🇸🇪", searchName: "Sweden" },
  { group: "Group F", team: "Tunisia",        flag: "🇹🇳", searchName: "Tunisia" },

  // ===== Group G =====
  { group: "Group G", team: "Belgium",        flag: "🇧🇪", searchName: "Belgium" },
  { group: "Group G", team: "Egypt",          flag: "🇪🇬", searchName: "Egypt" },
  { group: "Group G", team: "Iran",           flag: "🇮🇷", searchName: "Iran" },
  { group: "Group G", team: "New Zealand",    flag: "🇳🇿", searchName: "New Zealand" },

  // ===== Group H =====
  { group: "Group H", team: "Spain",          flag: "🇪🇸", searchName: "Spain",        sportsdbId: "133698" },
  { group: "Group H", team: "Cape Verde",     flag: "🇨🇻", searchName: "Cape Verde Islands" },
  { group: "Group H", team: "Saudi Arabia",   flag: "🇸🇦", searchName: "Saudi Arabia" },
  { group: "Group H", team: "Uruguay",        flag: "🇺🇾", searchName: "Uruguay" },

  // ===== Group I =====
  { group: "Group I", team: "France",         flag: "🇫🇷", searchName: "France",       sportsdbId: "133699" },
  { group: "Group I", team: "Senegal",        flag: "🇸🇳", searchName: "Senegal" },
  { group: "Group I", team: "Iraq",           flag: "🇮🇶", searchName: "Iraq" },
  { group: "Group I", team: "Norway",         flag: "🇳🇴", searchName: "Norway" },

  // ===== Group J =====
  { group: "Group J", team: "Argentina",      flag: "🇦🇷", searchName: "Argentina",    sportsdbId: "133697" },
  { group: "Group J", team: "Algeria",        flag: "🇩🇿", searchName: "Algeria" },
  { group: "Group J", team: "Austria",        flag: "🇦🇹", searchName: "Austria" },
  { group: "Group J", team: "Jordan",         flag: "🇯🇴", searchName: "Jordan" },

  // ===== Group K =====
  { group: "Group K", team: "Portugal",       flag: "🇵🇹", searchName: "Portugal",     sportsdbId: "133690" },
  { group: "Group K", team: "DR Congo",       flag: "🇨🇩", searchName: "DR Congo" },
  { group: "Group K", team: "Uzbekistan",     flag: "🇺🇿", searchName: "Uzbekistan" },
  { group: "Group K", team: "Colombia",       flag: "🇨🇴", searchName: "Colombia" },

  // ===== Group L =====
  { group: "Group L", team: "England",        flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", searchName: "England", sportsdbId: "133657" },
  { group: "Group L", team: "Croatia",        flag: "🇭🇷", searchName: "Croatia" },
  { group: "Group L", team: "Ghana",          flag: "🇬🇭", searchName: "Ghana" },
  { group: "Group L", team: "Panama",         flag: "🇵🇦", searchName: "Panama" },
];

export function Teams({ fixtures }: { fixtures: Fixture[] }) {
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  // Group teams by group letter
  const byGroup = useMemo(() => {
    const out: Record<string, TeamMeta[]> = {};
    ALL_TEAMS.forEach(t => { (out[t.group] ??= []).push(t); });
    return out;
  }, []);

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-bold text-lg mb-1">Participating teams</h2>
        <p className="text-sm text-[var(--muted)]">
          All 48 teams in the 2026 FIFA World Cup. Click any team to see their squad.
        </p>
        <p className="text-[10px] text-[var(--muted)] mt-2 opacity-70">
          Player photos from TheSportsDB (community-edited). Coverage and accuracy vary by team — biggest national sides like Argentina, Brazil, France, England, Germany, Mexico, USA have the most complete data.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(byGroup).map(([group, groupTeams]) => (
          <div key={group} className="card !p-0 overflow-hidden">
            <div className="group-banner px-4 py-3 border-b border-[var(--border)] text-xs text-[var(--gold)]">
              {group}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)]">
              {groupTeams.map(t => (
                <TeamCard
                  key={t.team}
                  team={t}
                  isOpen={openTeam === t.team}
                  onToggle={() => setOpenTeam(openTeam === t.team ? null : t.team)}
                />
              ))}
            </div>
            {groupTeams.some(t => t.team === openTeam) && (
              <Squad
                team={groupTeams.find(t => t.team === openTeam)!}
                onClose={() => setOpenTeam(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamCard({ team, isOpen, onToggle }: {
  team: TeamMeta;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={"bg-[var(--card)] p-3 text-left hover:bg-[var(--card-2)] transition flex items-center gap-2 " +
        (isOpen ? "bg-[var(--card-2)] ring-2 ring-inset ring-[var(--gold)]" : "")}
    >
      <span className="text-2xl">{team.flag}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold truncate">{team.team}</span>
        <span className="block text-[10px] text-[var(--muted)] uppercase tracking-wider">
          {team.group}
        </span>
      </span>
      <span className="text-[var(--muted)] text-xs">{isOpen ? "▲" : "▼"}</span>
    </button>
  );
}

function Squad({ team, onClose }: { team: TeamMeta; onClose: () => void }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(null); setPlayers(null);

    async function load() {
      try {
        let teamId = team.sportsdbId;

        // If we don't have a known ID, search and filter to international team
        if (!teamId) {
          const teamRes = await fetch(
            `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.searchName)}`
          );
          const teamJson = await teamRes.json();
          const candidates = teamJson.teams ?? [];

          // Prefer soccer national teams. Look for telltales: league "International",
          // description mentioning "national team", or stadium with national context.
          const isLikelyNational = (t: any) => {
            const sport = (t.strSport ?? "").toLowerCase();
            if (sport !== "soccer") return false;
            const league = (t.strLeague ?? "").toLowerCase();
            const desc = (t.strDescriptionEN ?? "").toLowerCase();
            return league.includes("international")
                || league.includes("world cup")
                || desc.includes("national team")
                || desc.includes("national football")
                || /\b(senior|national)\b/.test(desc);
          };

          const national = candidates.find(isLikelyNational);
          const fallbackSoccer = candidates.find((t: any) =>
            (t.strSport ?? "").toLowerCase() === "soccer"
          );
          const teamObj = national || fallbackSoccer;
          if (!teamObj) {
            if (!cancelled) { setErr("notfound"); setLoading(false); }
            return;
          }
          teamId = teamObj.idTeam;
        }

        // Fetch all players for that team
        const playersRes = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`
        );
        const playersJson = await playersRes.json();
        const raw = playersJson.player ?? [];
        const mapped: Player[] = raw
          .filter((p: any) => !p.strSport || p.strSport.toLowerCase() === "soccer")
          .map((p: any) => ({
            id: p.idPlayer,
            name: p.strPlayer,
            position: p.strPosition ?? null,
            // Prefer cutout (transparent bg), fall back to thumb
            cutout: p.strCutout || p.strThumb || null,
            number: p.strNumber ?? null,
          }))
          .sort((a: Player, b: Player) => {
            const an = parseInt(a.number ?? "999", 10);
            const bn = parseInt(b.number ?? "999", 10);
            if (an !== bn) return an - bn;
            return a.name.localeCompare(b.name);
          });
        if (!cancelled) { setPlayers(mapped); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) { setErr("network"); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [team.searchName, team.sportsdbId]);

  return (
    <div className="border-t border-[var(--border)] bg-[var(--card-2)] p-4">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <span className="text-2xl">{team.flag}</span>
          {team.team} squad
        </h3>
        <button onClick={onClose} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">
          Close ×
        </button>
      </div>

      {loading && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">Loading squad…</div>
      )}

      {err === "notfound" && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          Squad data not available yet for {team.team}.
          <div className="text-[10px] mt-1 opacity-70">
            TheSportsDB (our free data source) doesn't have a national team entry for this country yet.
            We'll show photos once they're added — or switch to API-Football for fuller coverage.
          </div>
        </div>
      )}

      {err === "network" && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          Couldn't reach TheSportsDB. Check your connection and try again.
        </div>
      )}

      {players && players.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {players.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-3 text-right">
            {players.length} player{players.length === 1 ? "" : "s"} · photos via TheSportsDB
          </div>
        </>
      )}

      {players && players.length === 0 && !err && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No players listed yet for this team on TheSportsDB.
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="bg-[var(--card)] rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--gold)] transition">
      <div className="aspect-square bg-gradient-to-b from-[var(--card-2)] to-[var(--bg-2)] flex items-center justify-center overflow-hidden relative">
        {player.cutout ? (
          <img
            src={player.cutout}
            alt={player.name}
            loading="lazy"
            className="w-full h-full object-cover object-top"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-4xl text-[var(--muted)]">👤</span>
        )}
        {player.number && (
          <span className="absolute top-1 right-1 text-[10px] font-bold bg-[var(--gold)] text-white px-1.5 rounded">
            #{player.number}
          </span>
        )}
      </div>
      <div className="p-2">
        <div className="text-xs font-semibold truncate">{player.name}</div>
        {player.position && (
          <div className="text-[10px] text-[var(--muted)] truncate">{player.position}</div>
        )}
      </div>
    </div>
  );
}
