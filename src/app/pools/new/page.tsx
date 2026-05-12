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
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_pool", {
      p_name: name.trim(),
      p_code: code.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    // Need to fetch back the code; easiest is to look up by id.
    const { data: pool } = await supabase.from("pools").select("code").eq("id", data).single();
    if (pool) router.push(`/pools/${pool.code}`);
  }

  return (
    <main className="max-w-md mx-auto p-6 mt-12">
      <h1 className="text-2xl font-bold mb-4">Create a pool</h1>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-[#9aa3c7]">Pool name</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            placeholder="Cazares Family Cup"
            className="w-full bg-[#0b1020] border border-[#2a3566] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[#ff4d6d]"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-[#9aa3c7]">Invite code (optional)</label>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="auto-generated if blank"
            className="w-full bg-[#0b1020] border border-[#2a3566] rounded-lg px-3 py-2 mt-1 font-mono uppercase tracking-widest outline-none focus:border-[#ff4d6d]"
          />
        </div>
        {err && <div className="text-sm text-[#ff4d6d]">{err}</div>}
        <button disabled={busy || !name} className="btn btn-primary justify-center">
          {busy ? "Creating…" : "Create pool"}
        </button>
      </form>
    </main>
  );
}
