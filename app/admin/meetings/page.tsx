"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Meeting {
  id: string;
  title: string;
  business: string;
  meeting_at: string;
  duration_minutes: number | null;
  location: string | null;
  contact_name: string | null;
  contact_company: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  status: string;
}

const BUSINESS_LABELS: Record<string, { label: string; color: string }> = {
  asl: { label: "L'Atelier Suisse (cession)", color: "#dc2626" },
  asl_b2c: { label: "L'Atelier Suisse B2C", color: "#991b1b" },
  asl_b2b: { label: "L'Atelier Suisse B2B", color: "#7c2d12" },
  justtag: { label: "Just-Tag", color: "#ea580c" },
  funkyfeet: { label: "FunkyFeet", color: "#7c3aed" },
  yattoo: { label: "Yattoo", color: "#22c55e" },
  onvoustrouve: { label: "OnVousTrouve", color: "#1e40af" },
  other: { label: "Autre", color: "#6b7280" },
};

const STATUS_LABELS: Record<string, { label: string; bg: string }> = {
  scheduled: { label: "Prévu", bg: "#dbeafe" },
  done: { label: "Réalisé", bg: "#d1fae5" },
  canceled: { label: "Annulé", bg: "#f3f4f6" },
};

const emptyForm = {
  title: "",
  business: "asl",
  meeting_at: "",
  duration_minutes: "60",
  location: "",
  contact_name: "",
  contact_company: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
  status: "scheduled",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const api = useCallback(async (action: string, extra = {}) => {
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await api("list");
    setMeetings(result.meetings || []);
    setLoading(false);
  }, [api]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  function startEdit(m: Meeting) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      business: m.business,
      meeting_at: m.meeting_at ? new Date(m.meeting_at).toISOString().slice(0, 16) : "",
      duration_minutes: String(m.duration_minutes ?? 60),
      location: m.location || "",
      contact_name: m.contact_name || "",
      contact_company: m.contact_company || "",
      contact_phone: m.contact_phone || "",
      contact_email: m.contact_email || "",
      notes: m.notes || "",
      status: m.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { alert("Le titre est requis"); return; }
    if (!form.meeting_at) { alert("La date du RDV est requise"); return; }

    const meeting: Record<string, unknown> = {
      title: form.title.trim(),
      business: form.business,
      meeting_at: new Date(form.meeting_at).toISOString(),
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      location: form.location.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_company: form.contact_company.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    const result = editingId
      ? await api("update", { id: editingId, meeting })
      : await api("create", { meeting });
    if (result.error) { alert("Erreur: " + result.error); return; }
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce RDV ?")) return;
    await api("delete", { id });
    loadData();
  }

  const now = new Date();
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const upcoming = meetings.filter(m => m.status !== "canceled" && new Date(m.meeting_at) >= today0);
  const past = meetings.filter(m => m.status === "canceled" || new Date(m.meeting_at) < today0);

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, color: "#888", marginBottom: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "20px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📅 Mes RDV</h1>
            <p style={{ color: "#666", fontSize: 13, margin: "4px 0 0" }}>Tous tes rendez-vous · Inclus dans le briefing Victor de 7h</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" style={{ padding: "8px 16px", borderRadius: 8, background: "#222", color: "#aaa", fontSize: 13, textDecoration: "none" }}>← Admin</Link>
            <Link href="/admin/crm" style={{ padding: "8px 16px", borderRadius: 8, background: "#222", color: "#aaa", fontSize: 13, textDecoration: "none" }}>🤖 CRM</Link>
            <button onClick={startNew} style={{ padding: "8px 16px", borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>+ Nouveau RDV</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSave} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{editingId ? "Modifier le RDV" : "Nouveau RDV"}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {editingId && <button type="button" onClick={() => { handleDelete(editingId); setShowForm(false); }} style={{ padding: "6px 12px", borderRadius: 6, background: "#dc2626", color: "white", fontSize: 12, border: "none", cursor: "pointer" }}>Supprimer</button>}
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ padding: "6px 12px", borderRadius: 6, background: "#333", color: "#ccc", fontSize: 12, border: "none", cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Titre *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="RDV cession ASL — NVNC" style={inputStyle} /></div>
              <div><label style={labelStyle}>Business</label><select value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} style={inputStyle}>{Object.entries(BUSINESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div><label style={labelStyle}>Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}><option value="scheduled">Prévu</option><option value="done">Réalisé</option><option value="canceled">Annulé</option></select></div>
              <div><label style={labelStyle}>Durée (min)</label><input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Date & heure *</label><input required type="datetime-local" value={form.meeting_at} onChange={e => setForm({ ...form, meeting_at: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={labelStyle}>Lieu</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Martigny / Atelier / Visio Teams" style={inputStyle} /></div>
              <div><label style={labelStyle}>Contact (nom)</label><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Marc Dupont" style={inputStyle} /></div>
              <div><label style={labelStyle}>Société</label><input value={form.contact_company} onChange={e => setForm({ ...form, contact_company: e.target.value })} placeholder="Atelier NVNC" style={inputStyle} /></div>
              <div><label style={labelStyle}>Téléphone</label><input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+41 27 ..." style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@..." style={inputStyle} /></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Notes / objectifs</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Préparer le NDA, deck PDF, fourchette de prix 60-80k..." style={{ ...inputStyle, resize: "vertical" }} /></div>
            </div>
            <button type="submit" style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>{editingId ? "Mettre à jour" : "Créer"}</button>
          </form>
        )}

        <h2 style={{ fontSize: 14, color: "#888", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>À venir ({upcoming.length})</h2>
        {loading ? (
          <p style={{ color: "#666" }}>Chargement...</p>
        ) : upcoming.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: 30 }}>Aucun RDV à venir</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(m => {
              const biz = BUSINESS_LABELS[m.business] || BUSINESS_LABELS.other;
              const st = STATUS_LABELS[m.status] || { label: m.status, bg: "#333" };
              const d = new Date(m.meeting_at);
              const isToday = d.toDateString() === now.toDateString();
              return (
                <div key={m.id} onClick={() => startEdit(m)} style={{ background: isToday ? "#1a1a05" : "#111", border: `1px solid ${isToday ? "#a16207" : "#222"}`, borderLeft: `4px solid ${biz.color}`, borderRadius: 10, padding: 14, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{isToday ? "🔥 " : ""}{m.title}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                        {d.toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" })} · {d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })}
                        {m.location && ` · ${m.location}`}
                        {m.contact_name && ` · ${m.contact_name}${m.contact_company ? ` (${m.contact_company})` : ""}`}
                      </div>
                      {m.notes && <div style={{ fontSize: 12, color: "#aaa", marginTop: 6, fontStyle: "italic" }}>{m.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: biz.color, color: "white" }}>{biz.label}</span>
                      <span style={{ padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: st.bg, color: "#1f2937" }}>{st.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 style={{ fontSize: 14, color: "#666", margin: "30px 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Passés / annulés ({past.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {past.map(m => {
                const biz = BUSINESS_LABELS[m.business] || BUSINESS_LABELS.other;
                const st = STATUS_LABELS[m.status] || { label: m.status, bg: "#333" };
                const d = new Date(m.meeting_at);
                return (
                  <div key={m.id} onClick={() => startEdit(m)} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderLeft: `3px solid ${biz.color}`, borderRadius: 8, padding: 10, cursor: "pointer", opacity: 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13 }}>{m.title} <span style={{ color: "#666", fontSize: 11 }}>· {d.toLocaleDateString("fr-CH")}</span></span>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, background: st.bg, color: "#1f2937" }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
