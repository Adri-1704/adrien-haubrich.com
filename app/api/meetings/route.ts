import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "list") {
    const { status, business, scope } = body;
    let query = supabase.from("meetings").select("*").order("meeting_at", { ascending: true });
    if (status) query = query.eq("status", status);
    if (business) query = query.eq("business", business);
    if (scope === "upcoming") {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      query = query.gte("meeting_at", now.toISOString()).neq("status", "canceled");
    }
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meetings: data || [] });
  }

  if (action === "get") {
    const { data, error } = await supabase.from("meetings").select("*").eq("id", body.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meeting: data });
  }

  if (action === "create") {
    const { meeting } = body;
    const { data, error } = await supabase.from("meetings").insert(meeting).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meeting: data });
  }

  if (action === "update") {
    const { id, meeting } = body;
    meeting.updated_at = new Date().toISOString();
    const { error } = await supabase.from("meetings").update(meeting).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await supabase.from("meetings").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
