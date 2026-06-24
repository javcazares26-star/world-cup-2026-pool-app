"use client";
import { useState } from "react";
import { Billboard } from "./_Billboard";
import type { Pool } from "@/lib/types";

type Member = { user_id: string; display_name: string; avatar_url?: string | null };

/**
 * Floating Billboard launcher — a button fixed bottom-left that opens a panel
 * with the shared message board. Rendered at the pool layout level so it's
 * available on every tab.
 */
export function BillboardWidget({ pool, userId, members }: { pool: Pool; userId: string; members: Member[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open billboard"
        title="Billboard"
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-[var(--crimson)] to-[var(--gold)] text-[#1a1a1a] shadow-lg flex items-center justify-center text-xl print:hidden"
      >
        📢
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-20 left-4 w-[min(380px,calc(100vw-2rem))] max-h-[72vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
              <h3 className="font-bold flex items-center gap-2">📢 Billboard</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none">
                ✕
              </button>
            </div>
            <div className="p-3">
              <Billboard pool={pool} userId={userId} members={members} embedded />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
