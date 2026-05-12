/**
 * Open Graph share card — dynamically generated PNG.
 * 1200x630, perfect for Twitter/X / FB / WhatsApp link previews.
 * URL: /api/og/{POOLCODE}  (or  /api/og/{POOLCODE}?u={userId}  for a personal stats card)
 */

import { ImageResponse } from "@vercel/og";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u");
  const supabase = createAdminClient();

  const code = params.code.toUpperCase();
  const { data: pool } = await supabase.from("pools").select("id,name,code").eq("code", code).maybeSingle();
  if (!pool) {
    return new ImageResponse(<div style={{ background: "#0b1020", color: "#fff", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>Pool not found</div>, { width: 1200, height: 630 });
  }

  let title = pool.name;
  let big = "";
  let sub = `Code: ${pool.code}`;
  if (userId) {
    const { data: row } = await supabase
      .from("v_leaderboard")
      .select("display_name,points,exact_count,picks_made")
      .eq("pool_id", pool.id).eq("user_id", userId).maybeSingle();
    if (row) {
      title = row.display_name;
      big = `${row.points} pts`;
      sub = `${row.exact_count} exact · ${row.picks_made} picks · ${pool.name}`;
    }
  } else {
    const { count } = await supabase.from("pool_members").select("user_id", { count: "exact", head: true }).eq("pool_id", pool.id);
    big = `Join the pool`;
    sub = `${count ?? 0} players · code ${pool.code}`;
  }

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(135deg, #ff4d6d 0%, #ffd23f 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: 60, color: "#1a1a1a",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 80 }}>⚽🏆</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>World Cup 2026 Pool</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 140, fontWeight: 900, lineHeight: 1 }}>{big}</div>
          <div style={{ fontSize: 32, marginTop: 16, opacity: 0.85 }}>{sub}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
