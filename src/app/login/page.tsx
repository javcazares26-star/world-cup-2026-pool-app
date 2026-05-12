"use client";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/pools";
  const [loading, setLoading] = useState(false);

  async function signInGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-24">
      <div className="card text-center">
        <div className="text-5xl">⚽</div>
        <h1 className="text-2xl font-bold mt-4">Sign in to play</h1>
        <p className="text-[#9aa3c7] text-sm mt-2">
          Use Google — fastest way in. Your name & avatar from Google will appear on the leaderboard.
        </p>
        <button onClick={signInGoogle} disabled={loading} className="btn btn-primary w-full mt-6 justify-center">
          {loading ? "Redirecting…" : "🔐 Continue with Google"}
        </button>
        <p className="text-xs text-[#9aa3c7] mt-6">
          By signing in you agree to be a good sport about losing to your in-laws.
        </p>
      </div>
    </main>
  );
}
