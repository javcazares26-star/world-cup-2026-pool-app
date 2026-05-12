"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinPoolForm() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("join_pool_by_code", { pool_code: code.trim() });
    setBusy(false);
    if (error) { setErr("Pool not found. Check the code."); return; }
    router.push(`/pools/${code.trim().toUpperCase()}`);
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2">
      <label className="text-xs uppercase tracking-wider text-[#9aa3c7]">Join with code</label>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="MEXFAM"
          maxLength={12}
          className="flex-1 bg-[#0b1020] border border-[#2a3566] rounded-lg px-3 py-2 font-mono uppercase tracking-widest text-center outline-none focus:border-[#ff4d6d]"
        />
        <button disabled={busy || !code} className="btn">Join</button>
      </div>
      {err && <div className="text-xs text-[#ff4d6d]">{err}</div>}
    </form>
  );
}
