"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Pool } from "@/lib/types";

export type Member = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  role: string;
  joined_at: string;
};

export type OwnedPoolRef = {
  id: string;
  code: string;
  name: string;
  created_at: string;
};

export function Admin({ pool, userId, members: initialMembers, ownedPools: initialOwnedPools }: {
  pool: Pool;
  userId: string;
  members: Member[];
  ownedPools: OwnedPoolRef[];
}) {
  const isOwner = pool.owner_id === userId;
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [ownedPools, setOwnedPools] = useState<OwnedPoolRef[]>(initialOwnedPools);
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pool.id);
  const [confirmCode, setConfirmCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [adminHidden, setAdminHidden] = useState(pool.admin_hidden);
  const [poolName, setPoolName] = useState(pool.name);
  const [newPoolName, setNewPoolName] = useState(pool.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const selectedPool = ownedPools.find(p => p.id === selectedPoolId) ?? null;

  if (!isOwner) {
    return (
      <div className="card text-center text-[var(--muted)]">
        <div className="text-4xl mb-2">🔒</div>
        <p>Only the pool owner can access admin tools.</p>
      </div>
    );
  }

  function flash(msg: string) {
    setOkMsg(msg); setErr(null);
    setTimeout(() => setOkMsg(null), 3000);
  }
  function fail(msg: string) {
    setErr(msg); setOkMsg(null);
  }

  async function removeMember(targetUserId: string, name: string) {
    if (!window.confirm(`Remove "${name}" from this pool?\n\nTheir picks, chat messages, and membership will be permanently deleted.`)) return;
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("remove_pool_member", {
      p_pool_id: pool.id,
      p_user_id: targetUserId,
    });
    setBusy(false);
    if (error) { fail(error.message); return; }
    setMembers(prev => prev.filter(m => m.user_id !== targetUserId));
    flash(`Removed ${name}.`);
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || busy) return;
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("add_pool_member_by_email", {
      p_pool_id: pool.id,
      p_email: inviteEmail.trim(),
    });
    setBusy(false);
    if (error) { fail(error.message); return; }
    flash(`Invited ${inviteEmail}. They'll see the pool on their dashboard.`);
    setInviteEmail("");
    router.refresh();
  }

  async function toggleAdminHidden() {
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("pools")
      .update({ admin_hidden: !adminHidden })
      .eq("id", pool.id);
    setBusy(false);
    if (error) { fail(error.message); return; }
    setAdminHidden(!adminHidden);
    flash(adminHidden ? "You're now visible in Members and Leaderboard." : "You're now hidden from Members and Leaderboard.");
  }

  async function renamePool(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newPoolName.trim();
    if (!trimmed || trimmed === poolName || busy) return;
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("pools")
      .update({ name: trimmed })
      .eq("id", pool.id);
    setBusy(false);
    if (error) { fail(error.message); return; }
    setPoolName(trimmed);
    setNewPoolName(trimmed);
    flash(`Pool renamed to "${trimmed}".`);
    router.refresh();
  }

  async function deletePool() {
    if (!selectedPool) { fail("Pick a pool from the dropdown first."); return; }
    if (confirmCode !== selectedPool.code) {
      fail(`Type "${selectedPool.code}" exactly to confirm deletion.`);
      return;
    }
    if (!window.confirm(`Permanently delete pool "${selectedPool.name}"?\n\nAll picks, messages, and members will be lost. This cannot be undone.`)) return;
    setErr(null); setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_pool", { p_pool_id: selectedPool.id });
    setBusy(false);
    if (error) { fail(error.message); return; }
    // Optimistically remove the deleted pool from the local list
    setOwnedPools(prev => prev.filter(p => p.id !== selectedPool.id));
    setConfirmCode("");
    // If you deleted the pool you're currently viewing, navigate away
    if (selectedPool.id === pool.id) {
      router.push("/pools");
    } else {
      flash(`Deleted "${selectedPool.name}".`);
      // Reset dropdown to current pool
      setSelectedPoolId(pool.id);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">

      {/* === Toasts === */}
      {okMsg && <div className="card !py-2 !px-4 text-sm text-[var(--pitch-light)]">✓ {okMsg}</div>}
      {err && <div className="card !py-2 !px-4 text-sm text-[var(--crimson)]">⚠ {err}</div>}

      {/* === Invite by email === */}
      <div className="card">
        <h2 className="font-bold text-lg mb-1">Invite by email</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          The easier path: just share your pool URL or invite code. But if a friend has already signed in once and you want to add them manually, drop their Google email here.
        </p>
        <form onSubmit={inviteMember} className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 min-w-[200px] bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm"
          />
          <button disabled={busy || !inviteEmail} className="btn btn-primary">
            {busy ? "…" : "Add to pool"}
          </button>
        </form>
      </div>

      {/* === Admin visibility toggle === */}
      <div className="card">
        <h2 className="font-bold text-lg mb-1">Visibility</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          {adminHidden
            ? "You are currently hidden from the Members list and Leaderboard. You can still access everything and see all members in the Admin panel."
            : "You are currently visible in the Members list and Leaderboard."}
        </p>
        <button
          onClick={toggleAdminHidden}
          disabled={busy}
          className={`btn ${adminHidden ? "btn-primary" : ""} justify-center`}
        >
          {busy ? "…" : adminHidden ? "👁 Make me visible" : "🔒 Hide me"}
        </button>
      </div>

      {/* === Rename Pool === */}
      <div className="card">
        <h2 className="font-bold text-lg mb-1">Rename pool</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          Change the name that appears at the top of this pool.
        </p>
        <form onSubmit={renamePool} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newPoolName}
            onChange={e => setNewPoolName(e.target.value)}
            placeholder="Pool name"
            className="flex-1 min-w-[200px] bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm"
          />
          <button
            disabled={busy || newPoolName.trim() === poolName || !newPoolName.trim()}
            className="btn btn-primary"
          >
            {busy ? "…" : "Rename"}
          </button>
        </form>
      </div>

      {/* === Members === */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Members</h2>
            <p className="text-xs text-[var(--muted)]">{members.length} player{members.length === 1 ? "" : "s"} in this pool</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
              <th className="text-left p-3">Player</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const isPoolOwner = m.user_id === pool.owner_id;
              const isMe = m.user_id === userId;
              return (
                <tr key={m.user_id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-2)]">
                  <td className="p-3 flex items-center gap-3">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      : <div className="w-8 h-8 rounded-full bg-[var(--card-2)] flex items-center justify-center text-xs font-bold">
                          {m.display_name.slice(0, 1).toUpperCase()}
                        </div>}
                    <span className={isPoolOwner ? "font-bold" : ""}>
                      {m.display_name}{isMe && " (you)"}
                    </span>
                  </td>
                  <td className="p-3">
                    {isPoolOwner ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--gold)] text-[#1a1408] font-bold">OWNER</span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">member</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-[var(--muted)]">
                    {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </td>
                  <td className="p-3 text-right">
                    {!isPoolOwner && (
                      <button
                        onClick={() => removeMember(m.user_id, m.display_name)}
                        disabled={busy}
                        className="btn !py-1 !px-3 text-xs hover:!bg-[var(--crimson)] hover:!border-[var(--crimson)]"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* === Danger zone — delete any pool you own === */}
      <div className="card" style={{ borderColor: "var(--crimson)" }}>
        <h2 className="font-bold text-lg text-[var(--crimson)]">⚠ Danger zone — delete a pool</h2>
        <p className="text-sm text-[var(--muted)] mt-1 mb-4">
          Pick any pool you own and type its code to confirm. Deleting wipes all picks, chat messages, members, and the pool itself — no undo.
        </p>

        {ownedPools.length === 0 ? (
          <div className="text-sm text-[var(--muted)] italic">You don't own any pools.</div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Pool to delete</label>
              <select
                value={selectedPoolId}
                onChange={(e) => { setSelectedPoolId(e.target.value); setConfirmCode(""); }}
                className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[var(--crimson)] text-sm"
              >
                {ownedPools.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}){p.id === pool.id ? " — current" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Type the code <span className="text-[var(--crimson)] font-mono">{selectedPool?.code ?? ""}</span> to confirm
              </label>
              <div className="flex gap-2 mt-1 flex-wrap">
                <input
                  value={confirmCode}
                  onChange={e => setConfirmCode(e.target.value.toUpperCase())}
                  placeholder={`Type "${selectedPool?.code ?? "CODE"}" exactly`}
                  className="flex-1 min-w-[200px] bg-[var(--bg-2)] border border-[var(--crimson)] rounded-lg px-3 py-2 outline-none font-mono text-sm tracking-widest"
                />
                <button
                  onClick={deletePool}
                  disabled={busy || !selectedPool || confirmCode !== selectedPool?.code}
                  className="btn"
                  style={{
                    background: selectedPool && confirmCode === selectedPool.code ? "var(--crimson)" : "var(--card-2)",
                    color: "#fff",
                    borderColor: "var(--crimson)",
                    opacity: selectedPool && confirmCode === selectedPool.code ? 1 : 0.4,
                  }}
                >
                  Delete pool forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
