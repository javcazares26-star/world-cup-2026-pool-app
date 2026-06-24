"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pool } from "@/lib/types";

type Member = { user_id: string; display_name: string; avatar_url?: string | null };
type Post = { id: string; pool_id: string; user_id: string; content: string; created_at: string };

export function Billboard({ pool, userId, members, embedded }: { pool: Pool; userId: string; members: Member[]; embedded?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const isOwner = pool.owner_id === userId;

  const byUser = useMemo(() => {
    const m = new Map<string, Member>();
    members.forEach((x) => m.set(x.user_id, x));
    return m;
  }, [members]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("billboard")
        .select("*")
        .eq("pool_id", pool.id)
        .order("created_at", { ascending: false });
      if (data) setPosts(data as Post[]);
    })();

    const ch = supabase
      .channel(`billboard-${pool.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "billboard", filter: `pool_id=eq.${pool.id}` }, (p) => {
        setPosts((prev) => (prev.some((x) => x.id === (p.new as any).id) ? prev : [p.new as Post, ...prev]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "billboard", filter: `pool_id=eq.${pool.id}` }, (p) => {
        setPosts((prev) => prev.filter((x) => x.id !== (p.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [pool.id]);

  const post = async () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("billboard")
      .insert({ pool_id: pool.id, user_id: userId, content })
      .select()
      .single();
    if (!error && data) {
      setText("");
      setPosts((prev) => (prev.some((x) => x.id === (data as Post).id) ? prev : [data as Post, ...prev]));
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    const supabase = createClient();
    await supabase.from("billboard").delete().eq("id", id);
    setPosts((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="card">
        {!embedded && (
          <>
            <h2 className="font-bold text-lg mb-1">📢 Billboard</h2>
            <p className="text-xs text-[var(--muted)] mb-3">Post a message for everyone in the pool. Updates live.</p>
          </>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Write something…"
          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--gold)] text-sm resize-y"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-[var(--muted)]">{text.length}/1000</span>
          <button
            onClick={post}
            disabled={busy || !text.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-[#1a1a1a] disabled:opacity-50"
          >
            {busy ? "Posting…" : "📌 Post"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {posts.length === 0 && (
          <div className="card text-center text-[var(--muted)] text-sm py-6">No messages yet — be the first to post!</div>
        )}
        {posts.map((p) => {
          const m = byUser.get(p.user_id);
          const name = m?.display_name ?? "Player";
          const me = p.user_id === userId;
          const canDelete = me || isOwner;
          return (
            <div key={p.id} className={"card !py-3 " + (me ? "border-l-4" : "")} style={me ? { borderLeftColor: "var(--gold)" } : undefined}>
              <div className="flex items-center gap-2 mb-1">
                {m?.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[var(--card-2)] flex items-center justify-center text-[10px] font-bold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold text-sm">{name}{me && " 👤"}</span>
                <span className="text-[10px] text-[var(--muted)]">
                  {new Date(p.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
                {canDelete && (
                  <button onClick={() => remove(p.id)} className="ml-auto text-[10px] text-[var(--muted)] hover:text-[var(--crimson)]">
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{p.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
