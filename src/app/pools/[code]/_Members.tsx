"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { Member } from "./_Admin";

export function Members({ userId, members: initial }: {
  userId: string;
  members: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const me = members.find(m => m.user_id === userId);
  const [location, setLocation] = useState(me?.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me?.avatar_url ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        location: location.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", userId);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMembers(prev => prev.map(m => m.user_id === userId
      ? { ...m, location: location.trim() || null, avatar_url: avatarUrl.trim() || null }
      : m));
    setEditing(false);
  }

  return (
    <div>
      <div className="card mb-4 flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg">Members</h2>
          <p className="text-sm text-[var(--muted)]">{members.length} player{members.length === 1 ? "" : "s"} in this pool</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn">
            ✏️ Edit my profile
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={save} className="card mb-4 flex flex-col gap-3">
          <h3 className="font-bold">Edit your profile</h3>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Frisco, TX · Mexico City · Guadalajara"
              maxLength={120}
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[var(--gold)] text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://… (paste an image link)"
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 mt-1 outline-none focus:border-[var(--gold)] text-sm"
            />
            <p className="text-[10px] text-[var(--muted)] mt-1 opacity-80">
              Paste a direct image URL (from Imgur, Google Photos shared link, etc.). Leave blank to use your Google avatar.
            </p>
          </div>
          {err && <div className="text-sm text-[var(--crimson)]">{err}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setErr(null); }} className="btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map(m => {
          const isMe = m.user_id === userId;
          return (
            <div key={m.user_id} className={"card flex items-center gap-3 " + (isMe ? "gold-border" : "")}>
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                : <div className="w-14 h-14 rounded-full bg-[var(--card-2)] flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {m.display_name.slice(0, 1).toUpperCase()}
                  </div>}
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">
                  {m.display_name}{isMe && <span className="text-[var(--gold)] text-xs ml-1">(you)</span>}
                </div>
                <div className="text-xs text-[var(--muted)] truncate">
                  {m.location ? `📍 ${m.location}` : <em>No location set</em>}
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-1">
                  Joined {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
