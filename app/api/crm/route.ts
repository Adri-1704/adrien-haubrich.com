import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Adrien2026!";

function auth(req: NextRequest): boolean {
  const pwd = req.headers.get("x-admin-password") || "";
  return pwd === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!auth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  // LIST all prospects
  if (action === "list") {
    const { status, type } = body;
    let query = supabase.from("prospects").select("*").order("next_follow_up_at", { ascending: true, nullsFirst: false });
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospects: data || [] });
  }

  // GET one prospect
  if (action === "get") {
    const { data, error } = await supabase.from("prospects").select("*").eq("id", body.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospect: data });
  }

  // CREATE prospect
  if (action === "create") {
    const { prospect } = body;
    const { data, error } = await supabase.from("prospects").insert(prospect).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospect: data });
  }

  // UPDATE prospect
  if (action === "update") {
    const { id, prospect } = body;
    prospect.updated_at = new Date().toISOString();
    const { error } = await supabase.from("prospects").update(prospect).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // DELETE prospect
  if (action === "delete") {
    const { error } = await supabase.from("prospects").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // STATS (pipeline counts)
  if (action === "stats") {
    const { data } = await supabase.from("prospects").select("status");
    const counts: Record<string, number> = {};
    for (const row of (data || []) as { status: string }[]) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }
    return NextResponse.json({ stats: counts });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
