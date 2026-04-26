import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Victor — Daily business briefing at 7:00 AM (CEST)
 *
 * Covers ALL of Adrien's businesses:
 * - Just-Tag: traffic, signups, subscriptions, blog, SEO
 * - Yattoo: Stripe revenue (via shared Supabase)
 * - CRM: pipeline, follow-ups, replies
 * - FunkyFeet: (future — Shopify API)
 *
 * Vercel Cron: 0 5 * * * (5h UTC = 7h CEST)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // ══════════════════════════════════════════════════════════
    // 0. RDV / MEETINGS (today + next 7 days)
    // ══════════════════════════════════════════════════════════
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { data: upcomingMeetings } = await supabase.from("meetings")
      .select("*")
      .gte("meeting_at", today.toISOString())
      .lte("meeting_at", sevenDaysAhead.toISOString())
      .neq("status", "canceled")
      .order("meeting_at", { ascending: true });

    type MeetingRow = {
      id: string; title: string; business: string; meeting_at: string;
      location: string | null; contact_name: string | null; contact_company: string | null;
      contact_phone: string | null; contact_email: string | null; notes: string | null;
    };
    const meetings = (upcomingMeetings || []) as MeetingRow[];
    const todayMeetings = meetings.filter(m => {
      const d = new Date(m.meeting_at); return d >= today && d <= todayEnd;
    });
    const laterMeetings = meetings.filter(m => new Date(m.meeting_at) > todayEnd);

    // ══════════════════════════════════════════════════════════
    // 1. CRM PROSPECTS
    // ══════════════════════════════════════════════════════════
    const [{ data: followUps }, { data: allProspects }, { data: replies }] = await Promise.all([
      supabase.from("prospects").select("*")
        .lte("next_follow_up_at", todayEnd.toISOString())
        .not("status", "in", '("paying","lost")')
        .order("priority").order("next_follow_up_at"),
      supabase.from("prospects").select("status"),
      supabase.from("prospects").select("name, email, phone")
        .eq("status", "replied").gte("updated_at", twoDaysAgo.toISOString()),
    ]);

    const pipelineStats: Record<string, number> = {};
    for (const p of (allProspects || []) as { status: string }[]) {
      pipelineStats[p.status] = (pipelineStats[p.status] || 0) + 1;
    }
    const totalProspects = Object.values(pipelineStats).reduce((s, n) => s + n, 0);

    // ══════════════════════════════════════════════════════════
    // 2. JUST-TAG — TRAFFIC
    // ══════════════════════════════════════════════════════════
    const [{ count: viewsYesterday }, { count: viewsWeek }, { count: viewsMonth }] = await Promise.all([
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("viewed_at", yesterday.toISOString()).lt("viewed_at", today.toISOString()),
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("viewed_at", weekAgo.toISOString()),
      supabase.from("page_views").select("id", { count: "exact", head: true }).gte("viewed_at", monthAgo.toISOString()),
    ]);

    // Top 5 pages yesterday
    const { data: topPagesRaw } = await supabase.from("page_views").select("path")
      .gte("viewed_at", yesterday.toISOString()).lt("viewed_at", today.toISOString()).limit(2000);
    const pageCounts: Record<string, number> = {};
    for (const r of (topPagesRaw || []) as { path: string }[]) pageCounts[r.path] = (pageCounts[r.path] || 0) + 1;
    const topPages = Object.entries(pageCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    // ══════════════════════════════════════════════════════════
    // 3. JUST-TAG — BUSINESS (merchants, subscriptions)
    // ══════════════════════════════════════════════════════════
    const [{ count: totalMerchants }, { count: activeSubs }, { count: newMerchantsWeek }] = await Promise.all([
      supabase.from("merchants").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("merchants").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    ]);

    // ══════════════════════════════════════════════════════════
    // 4. JUST-TAG — BLOG
    // ══════════════════════════════════════════════════════════
    const { count: publishedArticles } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true);

    // ══════════════════════════════════════════════════════════
    // 5. JUST-TAG — RESTAURANTS
    // ══════════════════════════════════════════════════════════
    const { count: totalRestaurants } = await supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("is_published", true);

    // ══════════════════════════════════════════════════════════
    // BUILD EMAIL
    // ══════════════════════════════════════════════════════════
    const dateStr = now.toLocaleDateString("fr-CH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const section = (title: string, emoji: string, content: string) => `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:15px;color:#1f2937;margin:0 0 10px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">${emoji} ${title}</h2>
        ${content}
      </div>`;

    const kpi = (label: string, value: string | number, color = "#1f2937") =>
      `<td style="padding:8px;background:#f9fafb;border-radius:6px;text-align:center;"><div style="font-size:20px;font-weight:bold;color:${color};">${value}</div><div style="font-size:10px;color:#6b7280;">${label}</div></td>`;

    let html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:18px;">🤖 Victor — Briefing du ${dateStr}</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;">Tous tes business en un coup d'oeil</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">`;

    // ── Meetings Section (TOP) ──
    const BUSINESS_LABELS: Record<string, { label: string; color: string }> = {
      asl: { label: "ASL Cession", color: "#dc2626" },
      asl_b2c: { label: "ASL B2C", color: "#991b1b" },
      asl_b2b: { label: "ASL B2B", color: "#7c2d12" },
      justtag: { label: "Just-Tag", color: "#ea580c" },
      funkyfeet: { label: "FunkyFeet", color: "#7c3aed" },
      yattoo: { label: "Yattoo", color: "#22c55e" },
      onvoustrouve: { label: "OnVousTrouve", color: "#1e40af" },
      other: { label: "Autre", color: "#6b7280" },
    };

    const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
    const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "short" });

    const renderMeeting = (m: MeetingRow, isToday: boolean) => {
      const biz = BUSINESS_LABELS[m.business] || BUSINESS_LABELS.other;
      const dateLabel = isToday ? `🔥 <strong>${fmtTime(m.meeting_at)}</strong>` : `${fmtDay(m.meeting_at)} · ${fmtTime(m.meeting_at)}`;
      const contact = [m.contact_name, m.contact_company].filter(Boolean).join(" — ");
      const phoneLink = m.contact_phone ? `<a href="tel:${m.contact_phone}" style="color:#2563eb;text-decoration:none;">📞 ${m.contact_phone}</a>` : "";
      const emailLink = m.contact_email ? `<a href="mailto:${m.contact_email}" style="color:#2563eb;text-decoration:none;">✉️</a>` : "";
      return `<div style="background:${isToday ? "#fffbeb" : "#f9fafb"};border:1px solid ${isToday ? "#fcd34d" : "#e5e7eb"};border-left:4px solid ${biz.color};border-radius:8px;padding:10px 12px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;flex-wrap:wrap;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#1f2937;">${m.title}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${dateLabel}${m.location ? ` · 📍 ${m.location}` : ""}</div>
            ${contact ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${contact} ${phoneLink} ${emailLink}</div>` : ""}
            ${m.notes ? `<div style="font-size:11px;color:#6b7280;margin-top:4px;font-style:italic;">${m.notes.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>` : ""}
          </div>
          <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:${biz.color};color:white;white-space:nowrap;">${biz.label}</span>
        </div>
      </div>`;
    };

    if (todayMeetings.length > 0 || laterMeetings.length > 0) {
      let mtgContent = "";
      if (todayMeetings.length > 0) {
        mtgContent += `<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:10px;margin-bottom:10px;">
          <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:6px;">🔥 ${todayMeetings.length} RDV AUJOURD'HUI</div>
          ${todayMeetings.map(m => renderMeeting(m, true)).join("")}
        </div>`;
      }
      if (laterMeetings.length > 0) {
        mtgContent += `<div style="font-size:11px;color:#6b7280;margin-bottom:6px;">Cette semaine (${laterMeetings.length})</div>
          ${laterMeetings.map(m => renderMeeting(m, false)).join("")}`;
      }
      html += section("Mes RDV", "🗓️", mtgContent);
    }

    // ── CRM Section ──
    let crmContent = `<table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:12px;"><tr>
      ${kpi("Total", totalProspects)}
      ${kpi("Contactés", pipelineStats["contacted"] || 0, "#d97706")}
      ${kpi("Répondu", pipelineStats["replied"] || 0, "#059669")}
      ${kpi("Payants", pipelineStats["paying"] || 0, "#16a34a")}
    </tr></table>`;

    if (followUps && followUps.length > 0) {
      crmContent += `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px;">📞 ${followUps.length} relance(s) aujourd'hui</div>`;
      for (const p of (followUps as { name: string; phone: string | null; email: string | null; follow_up_action: string | null; priority: string; city: string | null }[]).slice(0, 5)) {
        const icon = p.priority === "hot" ? "🔥 " : "";
        crmContent += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;">
          <span><strong>${icon}${p.name}</strong> — ${p.follow_up_action || "relance"}</span>
          <span style="color:#6b7280;">${p.phone || p.email || ""}</span>
        </div>`;
      }
      crmContent += `</div>`;
    }

    if (replies && replies.length > 0) {
      crmContent += `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
        <div style="font-size:13px;font-weight:600;color:#16a34a;margin-bottom:6px;">💬 ${replies.length} réponse(s) récente(s)</div>`;
      for (const r of (replies as { name: string; email: string | null }[])) {
        crmContent += `<div style="font-size:12px;padding:2px 0;">${r.name} ${r.email ? `(${r.email})` : ""}</div>`;
      }
      crmContent += `</div>`;
    }

    html += section("Prospection", "🎯", crmContent);

    // ── Just-Tag Section ──
    let jtContent = `<table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:12px;"><tr>
      ${kpi("Visites hier", viewsYesterday ?? 0, "#2563eb")}
      ${kpi("Visites 7j", viewsWeek ?? 0)}
      ${kpi("Visites 30j", viewsMonth ?? 0)}
      ${kpi("Restaurants", totalRestaurants ?? 0)}
    </tr></table>
    <table style="width:100%;border-collapse:separate;border-spacing:6px;"><tr>
      ${kpi("Inscrits", totalMerchants ?? 0)}
      ${kpi("Nouveaux (7j)", newMerchantsWeek ?? 0, "#2563eb")}
      ${kpi("Abonnés actifs", activeSubs ?? 0, "#16a34a")}
      ${kpi("Articles blog", publishedArticles ?? 0)}
    </tr></table>`;

    if (topPages.length > 0) {
      jtContent += `<div style="margin-top:12px;font-size:12px;color:#6b7280;">
        <strong>Top pages hier :</strong> ${topPages.map(([p, c]) => `${p} (${c})`).join(" · ")}
      </div>`;
    }

    html += section("Just-Tag.app", "🍽️", jtContent);

    // ── Yattoo Section ──
    // Note: Yattoo Stripe data is fetched via the admin API on adrien-haubrich.com
    // For the cron, we just show a reminder
    html += section("Yattoo.io", "📱", `
      <p style="font-size:13px;color:#6b7280;margin:0;">Stripe revenue visible sur <a href="https://adrien-haubrich.com/admin" style="color:#2563eb;">adrien-haubrich.com/admin</a>. Apple review : en attente.</p>
    `);

    // ── FunkyFeet Section ──
    html += section("FunkyFeet.ch", "🧦", `
      <p style="font-size:13px;color:#6b7280;margin:0;">Revenue Shopify visible sur <a href="https://funkyfeet.ch/admin" style="color:#2563eb;">Shopify admin</a>.</p>
    `);

    // ── Actions du jour ──
    const actions: string[] = [];
    if (todayMeetings.length > 0) actions.push(`🗓️ ${todayMeetings.length} RDV aujourd'hui — préparer les dossiers`);
    if (followUps && followUps.length > 0) actions.push(`📞 Relancer ${followUps.length} prospect(s)`);
    if (replies && replies.length > 0) actions.push(`💬 Répondre à ${replies.length} message(s)`);
    if (now.getDay() === 2) actions.push("📝 Publier l'article blog du mardi");
    if (now.getDay() === 5) actions.push("📝 Publier l'article blog du vendredi");
    if (now.getDay() === 1) actions.push("📊 Check Search Console (positions SEO)");
    if ((activeSubs ?? 0) === 0) actions.push("🎯 Objectif : décrocher le 1er abonnement payant");

    if (actions.length > 0) {
      let actionsContent = `<ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#1f2937;">`;
      for (const a of actions) actionsContent += `<li style="padding:3px 0;">${a}</li>`;
      actionsContent += `</ul>`;
      html += section("À faire aujourd'hui", "✅", actionsContent);
    }

    // ── CTAs ──
    html += `
        <div style="margin-top:24px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <a href="https://adrien-haubrich.com/admin/crm" style="display:inline-block;background:#1a1a2e;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">🤖 CRM</a>
          <a href="https://just-tag.app/admin/traffic" style="display:inline-block;background:#ff3c48;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📊 Trafic</a>
          <a href="https://just-tag.app/admin/blog" style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">📝 Blog</a>
          <a href="https://adrien-haubrich.com/admin" style="display:inline-block;background:#7c3aed;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">💰 Revenue</a>
        </div>

        <p style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center;">
          Victor — Agent CRM · adrien-haubrich.com
        </p>
      </div>
    </div>`;

    // ══════════════════════════════════════════════════════════
    // SEND EMAIL
    // ══════════════════════════════════════════════════════════
    const adminEmail = process.env.VICTOR_EMAIL || "contact@adrien-haubrich.com";
    const followUpCount = followUps?.length || 0;

    const subjectParts: string[] = [];
    if (todayMeetings.length > 0) subjectParts.push(`${todayMeetings.length} RDV aujourd'hui 🔥`);
    if (followUpCount > 0) subjectParts.push(`${followUpCount} relance(s)`);
    subjectParts.push(`${viewsYesterday ?? 0} visites hier`);
    subjectParts.push(`${activeSubs ?? 0} abonné(s)`);
    const subject = `🤖 Victor — ${subjectParts.join(" · ")}`;

    if (resend) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "Victor <contact@just-tag.app>",
        to: adminEmail,
        subject,
        html,
      });
    } else {
      console.log("[Victor] No RESEND_API_KEY — email skipped");
    }

    return NextResponse.json({
      ok: true,
      sentTo: adminEmail,
      summary: {
        meetingsToday: todayMeetings.length,
        meetingsWeek: meetings.length,
        followUps: followUpCount,
        prospects: totalProspects,
        viewsYesterday: viewsYesterday ?? 0,
        activeSubs: activeSubs ?? 0,
        totalRestaurants: totalRestaurants ?? 0,
      },
    });
  } catch (error) {
    console.error("Victor briefing error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
