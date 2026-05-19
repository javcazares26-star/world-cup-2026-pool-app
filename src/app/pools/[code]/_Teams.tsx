"use client";
import { useEffect, useMemo, useState } from "react";
import type { Fixture } from "@/lib/types";

type Player = {
  id: string;
  name: string;
  position: string | null;
  cutout: string | null;   // player image (prefer cutout, fallback to thumb)
  number?: string | null;
};

type TeamMeta = {
  group: string;
  team: string;
  flag: string;
  searchName: string;       // name to search on TheSportsDB
};

// === Country flag emojis for the 48 qualified teams ===
const FLAGS: Record<string, string> = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Rep. of Korea": "🇰🇷", "Czech Rep.": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia/Herzeg.": "🇧🇦", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪", "Egypt": "🇪🇬", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
};

// === Map our team names to TheSportsDB's preferred names ===
const SPORTSDB_NAME: Record<string, string> = {
  "Rep. of Korea": "South Korea",
  "Czech Rep.": "Czech Republic",
  "Bosnia/Herzeg.": "Bosnia and Herzegovina",
  "IR Iran": "Iran",
  "USA": "United States",
  "Cape Verde": "Cape Verde Islands",
  "DR Congo": "DR Congo",
  "Curaçao": "Curacao",
};

function sportsdbName(team: string): string {
  return SPORTSDB_NAME[team] ?? team;
}

export function Teams({ fixtures }: { fixtures: Fixture[] }) {
  // Derive 48 unique teams from the fixtures table, grouped A-L
  const teams = useMemo<TeamMeta[]>(() => {
    const set = new Map<string, TeamMeta>();
    fixtures.forEach(f => {
      if (!f.group_label) return;
      [f.home_team, f.away_team].forEach(team => {
        const key = `${f.group_label}|${team}`;
        if (!set.has(key)) {
          set.set(key, {
            group: f.group_label!,
            team,
            flag: FLAGS[team] ?? "🏳️",
            searchName: sportsdbName(team),
          });
        }
      });
    });
    return Array.from(set.values()).sort((a, b) =>
      a.group.localeCompare(b.group) || a.team.localeCompare(b.team)
    );
  }, [fixtures]);

  const [openTeam, setOpenTeam] = useState<string | null>(null);

  if (teams.length === 0) {
    return (
      <div className="card text-center text-[var(--muted)]">
        Teams will appear here once fixtures sync.
      </div>
    );
  }

  // Group teams by their group label for the visual layout
  const byGroup: Record<string, TeamMeta[]> = {};
  teams.forEach(t => { (byGroup[t.group] ??= []).push(t); });

  return (
    <div>
      <div className="card mb-4">
        <h2 className="font-bold text-lg mb-1">Participating teams</h2>
        <p className="text-sm text-[var(--muted)]">
          All 48 teams in the 2026 FIFA World Cup. Click any team to see their squad.
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
            {/* Squad expansion (shows below the 4-team row when one is selected) */}
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
        // 1. Look up the team by name
        const teamRes = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.searchName)}`
        );
        const teamJson = await teamRes.json();
        const teamObj = (teamJson.teams ?? []).find((t: any) =>
          (t.strSport ?? "").toLowerCase() === "soccer"
        );
        if (!teamObj) {
          if (!cancelled) { setErr("Squad data not available yet for this team."); setLoading(false); }
          return;
        }
        // 2. Get all players for that team
        const playersRes = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamObj.idTeam}`
        );
        const playersJson = await playersRes.json();
        const raw = playersJson.player ?? [];
        const mapped: Player[] = raw
          .filter((p: any) => !p.strSport || p.strSport.toLowerCase() === "soccer")
          .map((p: any) => ({
            id: p.idPlayer,
            name: p.strPlayer,
            position: p.strPosition ?? null,
            cutout: p.strCutout || p.strThumb || null,
            number: p.strNumber ?? null,
          }))
          // Sort: by jersey number if present, then name
          .sort((a: Player, b: Player) => {
            const an = parseInt(a.number ?? "999", 10);
            const bn = parseInt(b.number ?? "999", 10);
            if (an !== bn) return an - bn;
            return a.name.localeCompare(b.name);
          });
        if (!cancelled) { setPlayers(mapped); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) { setErr("Could not load squad. Check your connection."); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [team.searchName]);

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

      {err && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          {err}
          <div className="text-[10px] mt-1 opacity-70">
            Player photos come from TheSportsDB. National team rosters vary in coverage.
          </div>
        </div>
      )}

      {players && players.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {players.map(p => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-3 text-right">
            {players.length} player{players.length === 1 ? "" : "s"} · photos via TheSportsDB
          </div>
        </>
      )}

      {players && players.length === 0 && !err && (
        <div className="text-center py-6 text-sm text-[var(--muted)]">
          No players listed yet for this team.
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
