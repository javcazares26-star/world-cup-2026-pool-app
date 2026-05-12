"use client";
import { useState } from "react";

export function ShareBar({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/pools/${code}` : "";
  const ogUrl = typeof window !== "undefined" ? `${window.location.origin}/api/og/${code}` : "";
  const text = `Join my World Cup 2026 pool "${name}" — use code ${code}`;

  function open(href: string) { window.open(href, "_blank", "noopener,noreferrer"); }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function native() {
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }); } catch {}
    } else copy();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)}
        className="btn !py-2 !px-3 text-sm hover:bg-[#1da1f2] hover:border-[#1da1f2]">𝕏</button>
      <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)}
        className="btn !py-2 !px-3 text-sm hover:bg-[#1877f2] hover:border-[#1877f2]">📘</button>
      <button onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}
        className="btn !py-2 !px-3 text-sm hover:bg-[#25d366] hover:border-[#25d366]">💬</button>
      <button onClick={copy} className="btn !py-2 !px-3 text-sm">{copied ? "✓ Copied" : "🔗 Copy"}</button>
      <button onClick={native} className="btn !py-2 !px-3 text-sm">📤 Share</button>
      <a href={ogUrl} target="_blank" rel="noopener" className="btn !py-2 !px-3 text-sm">🖼 Card</a>
    </div>
  );
}
