import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/pools");

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-12">
      <div className="text-center mt-12 sm:mt-24">
        <div className="text-7xl">⚽🏆</div>
        <h1 className="text-4xl sm:text-6xl font-black mt-6 bg-gradient-to-r from-[#ff4d6d] to-[#ffd23f] bg-clip-text text-transparent">
          World Cup 2026 Pool
        </h1>
        <p className="text-lg text-[#9aa3c7] mt-4 max-w-xl mx-auto">
          Pick scores for every match. Earn 3 points for an exact score, 1 for the right outcome.
          Real-time scoring from the live tournament. Invite family and friends with a code.
        </p>
        <div className="mt-10 flex gap-3 justify-center flex-wrap">
          <Link href="/login" className="btn btn-primary">🚀 Get started</Link>
          <Link href="/login?guest=1" className="btn">👀 See a demo pool</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-16">
          <Feature icon="🇺🇸🇲🇽🇨🇦" title="All 104 matches" body="Group stage to final. Auto-synced from official fixtures." />
          <Feature icon="⚡" title="Real-time scoring" body="Points update the moment a goal is scored." />
          <Feature icon="📣" title="Share with friends" body="Invite via a 6-char code. Brag on Twitter/X, WhatsApp, Insta." />
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card text-left">
      <div className="text-2xl">{icon}</div>
      <div className="font-bold mt-2">{title}</div>
      <div className="text-sm text-[#9aa3c7] mt-1">{body}</div>
    </div>
  );
}
