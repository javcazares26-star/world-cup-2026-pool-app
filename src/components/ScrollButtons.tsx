"use client";

// Floating "scroll to top / bottom" buttons shown on every page.
// The pool page scrolls inside an inner container (marked data-scroll-container);
// other pages scroll the window. We target whichever applies.
export function ScrollButtons() {
  const getScroller = (): HTMLElement | null =>
    document.querySelector("[data-scroll-container]") as HTMLElement | null;

  const toTop = () => {
    const s = getScroller();
    if (s) s.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toBottom = () => {
    const s = getScroller();
    if (s) s.scrollTo({ top: s.scrollHeight, behavior: "smooth" });
    else
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
  };

  const btn =
    "w-10 h-10 rounded-full bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] shadow-lg flex items-center justify-center text-lg hover:bg-[var(--gold)] hover:text-[#1a1a1a] transition-colors";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 print:hidden">
      <button onClick={toTop} aria-label="Scroll to top" title="Go to top" className={btn}>
        ↑
      </button>
      <button onClick={toBottom} aria-label="Scroll to bottom" title="Go to bottom" className={btn}>
        ↓
      </button>
    </div>
  );
}
