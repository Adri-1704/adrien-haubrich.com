import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Load all admin data
export async function POST(request: Request) {
  try {
    const { password, action, monthKey, data } = await request.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (action === "load") {
      // Load all months
      const { data: rows, error } = await supabase
        .from("admin_data")
        .select("id, data")
        .like("id", "month-%");

      if (error) return Response.json({ error: error.message }, { status: 500 });

      const result: Record<string, unknown> = {};
      for (const row of rows || []) {
        const mk = row.id.replace("month-", "");
        result[mk] = row.data;
      }
      return Response.json({ months: result });
    }

    if (action === "save" && monthKey && data) {
      const { error } = await supabase
        .from("admin_data")
        .upsert({
          id: `month-${monthKey}`,
          data,
          updated_at: new Date().toISOString(),
        });

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
