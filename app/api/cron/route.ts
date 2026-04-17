import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Victor — Daily briefing email at 7:00 AM (CEST)
 * Vercel Cron: 0 5 * * * (5h UTC = 7h CEST)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Today's follow-ups
    const { data: followUps } = await supabase
      .from("prospects")
      .select("*")
      .lte("next_follow_up_at", today.toISOString())
      .not("status", "in", '("paying","lost")')
      .order("priority", { ascending: true })
      .order("next_follow_up_at", { ascending: true });

    // Pipeline stats
    const { data: allProspects } = await supabase.from("prospects").select("status");
    const stats: Record<string, number> = {};
    for (const p of (allProspects || []) as { status: string }[]) {
      stats[p.status] = (stats[p.status] || 0) + 1;
    }
    const total = Object.values(stats).reduce((s, n) => s + n, 0);

    // Recent replies (48h)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: replies } = await supabase
      .from("prospects")
      .select("name, email, phone, notes")
      .eq("status", "replied")
      .gte("updated_at", twoDaysAgo);

    // Build email
    const dateStr = new Date().toLocaleDateString("fr-CH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    let html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1a1a2e;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">🤖 Victor — ${dateStr}</h1>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">

      <h2 style="font-size:16px;color:#1f2937;margin:0 0 12px;">📊 Pipeline</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px;background:#f3f4f6;border-radius:6px;text-align:center;width:25%;">
            <div style="font-size:24px;font-weight:bold;">${total}</div>
            <div style="font-size:11px;color:#6b7280;">Total</div>
          </td>
          <td style="padding:8px;background:#fef3c7;border-radius:6px;text-align:center;width:25%;">
            <div style="font-size:24px;font-weight:bold;color:#92400e;">${stats["contacted"] || 0}</div>
            <div style="font-size:11px;color:#92400e;">Contactés</div>
          </td>
          <td style="padding:8px;background:#d1fae5;border-radius:6px;text-align:center;width:25%;">
            <div style="font-size:24px;font-weight:bold;color:#065f46;">${stats["replied"] || 0}</div>
            <div style="font-size:11px;color:#065f46;">Répondu</div>
          </td>
          <td style="padding:8px;background:#dcfce7;border-radius:6px;text-align:center;width:25%;">
            <div style="font-size:24px;font-weight:bold;color:#166534;">${stats["paying"] || 0}</div>
            <div style="font-size:11px;color:#166534;">Payants</div>
          </td>
        </tr>
      </table>`;

    if (followUps && followUps.length > 0) {
      html += `<h2 style="font-size:16px;color:#dc2626;margin:0 0 12px;">📞 À relancer aujourd'hui (${followUps.length})</h2><table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
      for (const p of followUps as { name: string; phone: string | null; email: string | null; follow_up_action: string | null; priority: string; city: string | null }[]) {
        const icon = p.priority === "hot" ? "🔥 " : "";
        const action = p.follow_up_action || "relance";
        const contact = [p.phone, p.email].filter(Boolean).join(" · ");
        html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 0;"><div style="font-weight:600;">${icon}${p.name}</div><div style="font-size:12px;color:#6b7280;">${action} · ${p.city || ""}</div></td><td style="padding:8px 0;text-align:right;font-size:12px;color:#6b7280;">${contact}</td></tr>`;
      }
      html += `</table>`;
    } else {
      html += `<p style="color:#6b7280;font-size:14px;margin-bottom:20px;">✅ Aucune relance prévue aujourd'hui.</p>`;
    }

    if (replies && replies.length > 0) {
      html += `<h2 style="font-size:16px;color:#059669;margin:0 0 12px;">💬 Réponses récentes (${replies.length})</h2>`;
      for (const r of replies as { name: string; email: string | null; phone: string | null }[]) {
        html += `<div style="background:#f0fdf4;padding:10px 14px;border-radius:8px;margin-bottom:8px;"><div style="font-weight:600;">${r.name}</div><div style="font-size:12px;color:#6b7280;">${r.email || ""} ${r.phone || ""}</div></div>`;
      }
    }

    html += `
        <div style="margin-top:20px;text-align:center;">
          <a href="https://adrien-haubrich.com/admin/crm" style="display:inline-block;background:#1a1a2e;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Ouvrir le CRM</a>
        </div>
      </div>
    </div>`;

    // Send
    const adminEmail = process.env.VICTOR_EMAIL || "contact@adrien-haubrich.com";

    if (resend) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "Victor <contact@just-tag.app>",
        to: adminEmail,
        subject: `🤖 Victor — ${followUps?.length || 0} relance(s) · ${total} prospects`,
        html,
      });
    } else {
      console.log("[Victor] No RESEND_API_KEY — email skipped. Would send to:", adminEmail);
    }

    return NextResponse.json({ ok: true, followUps: followUps?.length || 0, total, sentTo: adminEmail });
  } catch (error) {
    console.error("Victor briefing error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
