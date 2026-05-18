"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPoolPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;          // prevent double-submit
    setErr(null); setBusy(true);
    const supabase = createClient();

    const { data: poolId, error } = await supabase.rpc("create_pool", {
      p_name: name.trim(),
      p_code: code.trim() || null,
    });
    if (error) { setBusy(false); setErr(error.message); return; }

    // Try to fetch the code; if RLS or timing prevents it, fall back to /pools list.
    const { data: pool } = await supabase
      .from("pools")
      .select("code")
      .eq("id", poolId as string)
      .maybeSingle();

    if (pool?.code) {
      router.push(`/pools/${pool.code}`);
    } else {
      // Fallback: pool exists, we just can't read it back yet — go to list.
      router.push("/pools");
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold mb-4">Create a pool</h1>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Pool name</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            placeholder="Cazares Family Cup"
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[var(--crimson)]"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[var(--muted)]">Invite code (optional)</label>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="auto-generated if blank"
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 font-mono uppercase tracking-widest outline-none focus:border-[var(--crimson)]"
          />
        </div>
        {err && <div className="text-sm text-[var(--crimson)]">{err}</div>}
        <button disabled={busy || !name} className="btn btn-primary justify-center">
          {busy ? "Creating…" : "Create pool"}
        </button>
      </form>
    </main>
  );
}
