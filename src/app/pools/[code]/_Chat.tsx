"use client";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  poolId: string;
  userId: string;
  initial: Message[];
};

export function Chat({ poolId, userId, initial }: Props) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const profileCacheRef = useRef<Record<string, { display_name: string; avatar_url: string | null }>>({});

  // Seed profile cache from initial messages so realtime inserts can render names immediately
  useEffect(() => {
    initial.forEach(m => {
      if (m.display_name) {
        profileCacheRef.current[m.user_id] = {
          display_name: m.display_name,
          avatar_url: m.avatar_url ?? null,
        };
      }
    });
  }, [initial]);

  // Subscribe to realtime inserts for this pool
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`chat-${poolId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `pool_id=eq.${poolId}` },
        async (payload) => {
          const m = payload.new as Message;
          // Skip if already optimistically inserted (same id)
          setMessages(prev => {
            if (prev.some(x => x.id === m.id)) return prev;
            const profile = profileCacheRef.current[m.user_id];
            return [...prev, { ...m, display_name: profile?.display_name, avatar_url: profile?.avatar_url }];
          });
          // If we don't have this user in cache, fetch their profile
          if (!profileCacheRef.current[m.user_id]) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name,avatar_url")
              .eq("id", m.user_id)
              .maybeSingle();
            if (data) {
              profileCacheRef.current[m.user_id] = data;
              setMessages(prev => prev.map(x =>
                x.user_id === m.user_id && !x.display_name
                  ? { ...x, display_name: data.display_name, avatar_url: data.avatar_url }
                  : x
              ));
            }
          }
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `pool_id=eq.${poolId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages(prev => prev.filter(m => m.id !== old.id));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [poolId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setErr(null); setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const me = profileCacheRef.current[userId];
    const optimistic: Message = {
      id: tempId, pool_id: poolId, user_id: userId,
      content: trimmed, created_at: new Date().toISOString(),
      display_name: me?.display_name ?? "You",
      avatar_url: me?.avatar_url ?? null,
    };
    setMessages(prev => [...prev, optimistic]);
    setText("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ pool_id: poolId, user_id: userId, content: trimmed })
      .select("id,created_at")
      .single();

    setSending(false);

    if (error) {
      // Roll back the optimistic message and show the error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmed);
      setErr(error.message);
      return;
    }

    // Replace temp ID with real ID so realtime echo doesn't double-insert
    setMessages(prev => prev.map(m => m.id === tempId
      ? { ...m, id: data!.id, created_at: data!.created_at }
      : m));
  }

  async function remove(id: string) {
    const supabase = createClient();
    setMessages(prev => prev.filter(m => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  }

  // Group messages by author when consecutive (cleaner UI)
  const grouped = useMemo(() => {
    const out: { author: string; avatar: string | null; userId: string; items: Message[] }[] = [];
    messages.forEach(m => {
      const last = out[out.length - 1];
      if (last && last.userId === m.user_id) {
        last.items.push(m);
      } else {
        out.push({
          author: m.display_name ?? "Player",
          avatar: m.avatar_url ?? null,
          userId: m.user_id,
          items: [m],
        });
      }
    });
    return out;
  }, [messages]);

  return (
    <div className="card !p-0 overflow-hidden flex flex-col" style={{ height: "min(70vh, 600px)" }}>
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base">Pool chat</h2>
          <p className="text-[10px] text-[var(--muted)]">Only members of this pool can see and post here.</p>
        </div>
        <div className="text-[10px] text-[var(--muted)]">{messages.length} message{messages.length === 1 ? "" : "s"}</div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[var(--muted)] mt-12">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No messages yet. Be the first to say something!</p>
            <p className="text-xs mt-1 opacity-70">Try: <em>"Quien gana el viernes?"</em></p>
          </div>
        )}

        {grouped.map((group, gi) => {
          const isMe = group.userId === userId;
          return (
            <div key={gi} className={"flex gap-3 " + (isMe ? "flex-row-reverse" : "")}>
              {group.avatar
                ? <img src={group.avatar} alt="" className="w-8 h-8 rounded-full mt-1 flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-[var(--card-2)] mt-1 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    {group.author.slice(0, 1).toUpperCase()}
                  </div>}
              <div className={"flex flex-col gap-2 max-w-[80%] " + (isMe ? "items-end" : "items-start")}>
                <div className={"text-xs text-[var(--muted)] font-semibold " + (isMe ? "text-right" : "")}>
                  {isMe ? "You" : group.author}
                </div>
                {group.items.map(m => (
                  <div key={m.id} className="flex items-end gap-2 group/msg max-w-full">
                    {isMe && (
                      <button
                        onClick={() => remove(m.id)}
                        className="opacity-0 group-hover/msg:opacity-100 text-xs text-[var(--crimson)] transition px-1"
                        title="Delete">×</button>
                    )}
                    <div className={"px-4 py-3 rounded-2xl break-words font-semibold " +
                      (isMe
                        ? "bg-gradient-to-br from-[var(--crimson)] to-[var(--gold)] text-[#1a1a1a] rounded-br-sm text-base"
                        : "bg-[var(--card-2)] text-white rounded-bl-sm text-base shadow-md")}>
                      {m.content}
                    </div>
                    <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="border-t border-[var(--border)] p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          disabled={sending}
          className="flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-full px-4 py-2 outline-none focus:border-[var(--crimson)] text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn btn-primary !rounded-full !px-5">
          {sending ? "…" : "Send"}
        </button>
      </form>
      {err && <div className="px-3 pb-2 text-xs text-[var(--crimson)]">{err}</div>}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  // Same day → time only
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  // Different day → date + time
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
