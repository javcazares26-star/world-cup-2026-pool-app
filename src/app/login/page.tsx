"use client";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/pools";
  const [loading, setLoading] = useState(false);

  // === Email magic-link state ===
  const [email, setEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  async function signInGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || emailBusy) return;
    setEmailErr(null); setEmailBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback-client?next=${encodeURIComponent(next)}`,
      },
    });
    setEmailBusy(false);
    if (error) { setEmailErr(error.message); return; }
    setEmailSent(true);
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-16">
      <div className="card text-center">
        <div className="text-5xl">⚽</div>
        <h1 className="text-2xl font-bold mt-4">Sign in to play</h1>
        <p className="text-[var(--muted)] text-sm mt-2">
          Pick a way to sign in. Both work the same once you're in.
        </p>

        {/* ===== Google sign-in ===== */}
        <button
          onClick={signInGoogle}
          disabled={loading}
          className="btn btn-primary w-full mt-6 justify-center"
        >
          {loading ? "Redirecting…" : "🔐 Continue with Google"}
        </button>

        {/* ===== Divider ===== */}
        <div className="flex items-center gap-3 my-5 text-[10px] uppercase tracking-widest text-[var(--muted)]">
          <span className="flex-1 h-px bg-[var(--border)]" />
          or use email
          <span className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* ===== Email magic-link ===== */}
        {emailSent ? (
          <div className="bg-[var(--card-2)] border border-[var(--pitch-light)] rounded-lg p-4 text-sm">
            <div className="text-3xl mb-1">📬</div>
            <p className="font-semibold">Check your email</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              We sent a sign-in link to <span className="font-mono">{email}</span>. Click the link in the email to finish signing in.
            </p>
            <button
              onClick={() => { setEmailSent(false); setEmail(""); }}
              className="text-[var(--gold)] text-xs underline mt-3"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm text-center"
            />
            <button
              type="submit"
              disabled={emailBusy || !email}
              className="btn w-full justify-center"
            >
              {emailBusy ? "Sending…" : "📨 Email me a sign-in link"}
            </button>
            {emailErr && (
              <div className="text-xs text-[var(--crimson)]">{emailErr}</div>
            )}
            <p className="text-[10px] text-[var(--muted)] mt-1 opacity-80">
              No password needed. We email you a one-time link. The link works once — open it on the same device you typed your email on.
            </p>
          </form>
        )}

        <p className="text-xs text-[var(--muted)] mt-6">
          By signing in you agree to be a good sport about losing to your in-laws.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="max-w-md mx-auto p-6 mt-24">
        <div className="card text-center">
          <div className="text-5xl">⚽</div>
          <p className="text-[var(--muted)] mt-4">Loading…</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
