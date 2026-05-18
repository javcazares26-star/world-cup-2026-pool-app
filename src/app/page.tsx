import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/pools");

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 sm:py-16">

      {/* === Eyebrow: hosts === */}
      <div className="flex justify-center items-center gap-3 text-xs uppercase tracking-[0.4em] text-[var(--gold)] opacity-90 mb-6">
        <span>🇨🇦</span>
        <span>Canada</span>
        <span className="text-[var(--border)]">·</span>
        <span>🇲🇽</span>
        <span>México</span>
        <span className="text-[var(--border)]">·</span>
        <span>🇺🇸</span>
        <span>USA</span>
      </div>

      {/* === Hero === */}
      <div className="text-center">
        <div className="text-8xl mb-2 trophy-shine">🏆</div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-3">
          <span className="bg-gradient-to-b from-[var(--gold-light)] to-[var(--gold-deep)] bg-clip-text text-transparent">
            World Cup
          </span>
          <span className="block text-[var(--text)] mt-1 text-4xl sm:text-6xl">
            2026 Pool
          </span>
        </h1>

        <div className="inline-flex items-center gap-3 mt-2 px-4 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] text-xs uppercase tracking-widest text-[var(--muted)]">
          <span className="text-[var(--gold)]">●</span>
          June 11 — July 19
          <span className="text-[var(--gold)]">●</span>
          48 teams · 104 matches
        </div>

        <p className="text-base sm:text-lg text-[var(--muted)] mt-7 max-w-xl mx-auto leading-relaxed">
          Pick scores for every match. Earn <span className="text-[var(--gold)] font-bold">3 points</span> for an exact score,
          <span className="text-[var(--pitch-light)] font-bold"> 1 point</span> for the right outcome.
          Real-time scoring. Invite family and friends with a code.
        </p>

        <div className="mt-10 flex gap-3 justify-center flex-wrap">
          <Link href="/login" className="btn btn-primary text-base">🚀 Get started</Link>
          <Link href="/login?guest=1" className="btn text-base">👀 See a demo pool</Link>
        </div>
      </div>

      {/* === Feature cards === */}
      <div className="grid sm:grid-cols-3 gap-4 mt-16">
        <Feature icon="📅" title="All 104 matches" body="Group stage to final. Auto-synced from official fixtures, real venues, real dates." />
        <Feature icon="⚡" title="Real-time scoring" body="Points update the moment a goal is scored. Live leaderboard across your whole pool." />
        <Feature icon="📣" title="Share with friends" body="Invite via a 6-character code. Brag on Twitter/X, WhatsApp, Instagram." />
      </div>

      {/* === Footer === */}
      <div className="text-center mt-12 text-xs text-[var(--muted)]">
        Free family + friends pool. No ads. Inspired by FIFA Beach Soccer & FIFA Match Center.
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card text-left relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--gold)] via-[var(--gold-deep)] to-transparent opacity-60" />
      <div className="text-3xl">{icon}</div>
      <div className="font-bold mt-3 text-base">{title}</div>
      <div className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">{body}</div>
    </div>
  );
}
