"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Prospect {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  city: string | null;
  canton: string | null;
  type: string;
  source: string;
  status: string;
  priority: string;
  notes: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  follow_up_action: string | null;
}

const STATUS_LABELS: Record<string, { label: string; bg: string }> = {
  new: { label: "Nouveau", bg: "#dbeafe" },
  contacted: { label: "Contacté", bg: "#fef3c7" },
  replied: { label: "Répondu", bg: "#d1fae5" },
  meeting: { label: "RDV", bg: "#e9d5ff" },
  trial: { label: "Essai", bg: "#cffafe" },
  paying: { label: "Payant", bg: "#bbf7d0" },
  lost: { label: "Perdu", bg: "#f3f4f6" },
};

export default function CRMPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", contact_name: "", email: "", phone: "", instagram: "",
    city: "", canton: "", type: "restaurant", source: "manual",
    status: "new", priority: "normal", notes: "",
    last_contact_at: "", next_follow_up_at: "", follow_up_action: "",
  });

  useEffect(() => {
    const saved = sessionStorage.getItem("ah-admin-auth");
    const pwd = sessionStorage.getItem("ah-admin-pwd");
    if (saved === "1" && pwd) { setAuthenticated(true); setPassword(pwd); }
  }, []);

  const api = useCallback(async (action: string, extra = {}) => {
    const pwd = password || sessionStorage.getItem("ah-admin-pwd") || "";
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, password: pwd, ...extra }),
    });
    return res.json();
  }, [password]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ prospects: p }, { stats: s }] = await Promise.all([
      api("list", filter ? { status: filter } : {}),
      api("stats"),
    ]);
    setProspects(p || []);
    setStats(s || {});
    setLoading(false);
  }, [api, filter]);

  useEffect(() => { if (authenticated) loadData(); }, [authenticated, loadData]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("ah-admin-auth", "1");
    sessionStorage.setItem("ah-admin-pwd", password);
    setAuthenticated(true);
  }

  function openNew() {
    setEditingProspect(null);
    setForm({ name: "", contact_name: "", email: "", phone: "", instagram: "", city: "", canton: "", type: "restaurant", source: "manual", status: "new", priority: "normal", notes: "", last_contact_at: "", next_follow_up_at: "", follow_up_action: "" });
    setShowForm(true);
  }

  function openEdit(p: Prospect) {
    setEditingProspect(p);
    setForm({
      name: p.name, contact_name: p.contact_name || "", email: p.email || "",
      phone: p.phone || "", instagram: p.instagram || "", city: p.city || "",
      canton: p.canton || "", type: p.type, source: p.source, status: p.status,
      priority: p.priority, notes: p.notes || "",
      last_contact_at: p.last_contact_at?.slice(0, 10) || "",
      next_follow_up_at: p.next_follow_up_at?.slice(0, 10) || "",
      follow_up_action: p.follow_up_action || "",
    });
    setShowForm(true);
  }

  async function saveProspect(e: React.FormEvent) {
    e.preventDefault();
    // Clean empty strings to null
    const prospect: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(form)) {
      prospect[key] = (typeof val === "string" && val.trim() === "") ? null : val;
    }
    // Name is required
    if (!prospect.name) { alert("Le nom est requis"); return; }

    try {
      let result;
      if (editingProspect) {
        result = await api("update", { id: editingProspect.id, prospect });
      } else {
        result = await api("create", { prospect });
      }
      if (result.error) {
        alert("Erreur: " + result.error);
        return;
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      alert("Erreur réseau: " + String(err));
    }
  }

  async function deleteProspect(id: string) {
    if (!confirm("Supprimer ce prospect ?")) return;
    await api("delete", { id });
    loadData();
  }

  const today = new Date(); today.setHours(23, 59, 59, 999);
  const todayFollowUps = prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) <= today && p.status !== "paying" && p.status !== "lost");
  const total = Object.values(stats).reduce((s, n) => s + n, 0);

  if (!authenticated) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <form onSubmit={login} style={{ width: 320 }}>
          <h1 style={{ color: "white", textAlign: "center", marginBottom: 24, fontSize: 20 }}>CRM Victor</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" autoFocus
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          <button type="submit" style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}>
            Connexion
          </button>
        </form>
      </div>
    );
  }

  const inputStyle = "width:100%;padding:8px 12px;border-radius:6px;border:1px solid #333;background:#111;color:white;font-size:13px;outline:none;box-sizing:border-box;";
  const selectStyle = inputStyle;
  const labelStyle = "display:block;font-size:11px;color:#888;margin-bottom:4px;";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "20px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🤖 CRM Victor</h1>
            <p style={{ color: "#666", fontSize: 13, margin: "4px 0 0" }}>Pipeline de prospection · Email quotidien à 7h</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" style={{ padding: "8px 16px", borderRadius: 8, background: "#222", color: "#aaa", fontSize: 13, textDecoration: "none" }}>← Admin</Link>
            <button onClick={openNew} style={{ padding: "8px 16px", borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>+ Ajouter</button>
          </div>
        </div>

        {/* Pipeline pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          <button onClick={() => setFilter("")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: !filter ? "white" : "#222", color: !filter ? "black" : "#888" }}>
            Tous ({total})
          </button>
          {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
            <button key={key} onClick={() => setFilter(key)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: filter === key ? "white" : "#222", color: filter === key ? "black" : "#888" }}>
              {label} ({stats[key] || 0})
            </button>
          ))}
        </div>

        {/* Today's follow-ups */}
        {todayFollowUps.length > 0 && (
          <div style={{ background: "#1a0505", border: "2px solid #dc2626", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <h3 style={{ color: "#dc2626", fontSize: 14, margin: "0 0 12px" }}>🔔 À relancer aujourd&apos;hui ({todayFollowUps.length})</h3>
            {todayFollowUps.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#220505", padding: "10px 14px", borderRadius: 8, marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.priority === "hot" ? "🔥 " : ""}{p.name}</span>
                  <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>{p.follow_up_action || "relance"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {p.phone && <a href={`tel:${p.phone}`} style={{ color: "#aaa", fontSize: 12 }}>📞 {p.phone}</a>}
                  {p.email && <a href={`mailto:${p.email}`} style={{ color: "#aaa", fontSize: 12 }}>✉️</a>}
                  <button onClick={() => openEdit(p)} style={{ padding: "4px 10px", borderRadius: 6, background: "#333", color: "#ccc", fontSize: 11, border: "none", cursor: "pointer" }}>Modifier</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{editingProspect ? "Modifier" : "Nouveau prospect"}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {editingProspect && <button onClick={() => { deleteProspect(editingProspect.id); setShowForm(false); }} style={{ padding: "6px 12px", borderRadius: 6, background: "#dc2626", color: "white", fontSize: 12, border: "none", cursor: "pointer" }}>Supprimer</button>}
                <button onClick={() => setShowForm(false)} style={{ padding: "6px 12px", borderRadius: 6, background: "#333", color: "#ccc", fontSize: 12, border: "none", cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
            <form onSubmit={saveProspect}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Nom *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Restaurant La Grotte" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Contact</label><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Jean Dupont" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@resto.ch" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Téléphone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+41 27 455 46 46" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Ville</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Sion" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Canton</label><select value={form.canton} onChange={e => setForm({ ...form, canton: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="">—</option><option value="geneve">Genève</option><option value="vaud">Vaud</option><option value="valais">Valais</option><option value="fribourg">Fribourg</option><option value="neuchatel">Neuchâtel</option><option value="jura">Jura</option><option value="berne">Berne</option></select></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="restaurant">Restaurant</option><option value="partner">Partenaire</option><option value="influencer">Influenceur</option></select></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="new">Nouveau</option><option value="contacted">Contacté</option><option value="replied">Répondu</option><option value="meeting">RDV</option><option value="trial">Essai</option><option value="paying">Payant</option><option value="lost">Perdu</option></select></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Priorité</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="hot">🔥 Chaud</option><option value="normal">Normal</option><option value="low">Basse</option></select></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Prochaine relance</label><input type="date" value={form.next_follow_up_at} onChange={e => setForm({ ...form, next_follow_up_at: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Action prévue</label><select value={form.follow_up_action} onChange={e => setForm({ ...form, follow_up_action: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="">—</option><option value="relance_email">Relance email</option><option value="appel">Appel</option><option value="rdv">Prendre RDV</option><option value="envoyer_offre">Envoyer offre</option><option value="demo">Démo</option></select></div>
                <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Source</label><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}><option value="manual">Manuel</option><option value="call">Appel</option><option value="brevo">Brevo</option><option value="insta_dm">DM Insta</option><option value="partner_email">Email partenariat</option><option value="terrain">Terrain</option><option value="linkedin">LinkedIn</option></select></div>
              </div>
              <div style={{ marginTop: 12 }}><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notes libres..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }} /></div>
              <button type="submit" style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>
                {editingProspect ? "Mettre à jour" : "Créer"}
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p style={{ color: "#666", textAlign: "center", padding: 40 }}>Chargement...</p>
        ) : prospects.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
            <p style={{ fontSize: 16 }}>Aucun prospect</p>
            <button onClick={openNew} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, background: "white", color: "black", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>+ Ajouter le premier</button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", color: "#666", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Prospect</th>
                <th style={{ padding: "10px 12px", color: "#666", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Statut</th>
                <th style={{ padding: "10px 12px", color: "#666", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Prochaine action</th>
                <th style={{ padding: "10px 12px", color: "#666", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Contact</th>
                <th style={{ padding: "10px 12px", color: "#666", fontWeight: 600, fontSize: 11, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const st = STATUS_LABELS[p.status] || { label: p.status, bg: "#333" };
                const isOverdue = p.next_follow_up_at && new Date(p.next_follow_up_at) <= today && p.status !== "paying" && p.status !== "lost";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a", background: isOverdue ? "#1a0505" : "transparent" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{p.priority === "hot" ? "🔥 " : ""}{p.name}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{[p.city, p.canton].filter(Boolean).join(", ")} · {p.type}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: st.bg, color: "#1f2937" }}>{st.label}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {p.next_follow_up_at ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? "#dc2626" : "#ccc" }}>
                            {new Date(p.next_follow_up_at).toLocaleDateString("fr-CH")} {isOverdue ? "⚠️" : ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#666" }}>{p.follow_up_action || "—"}</div>
                        </div>
                      ) : <span style={{ color: "#444" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {p.phone && <a href={`tel:${p.phone}`} style={{ color: "#888", fontSize: 11, textDecoration: "none" }}>📞</a>}
                        {p.email && <a href={`mailto:${p.email}`} style={{ color: "#888", fontSize: 11, textDecoration: "none" }}>✉️</a>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <button onClick={() => openEdit(p)} style={{ padding: "4px 12px", borderRadius: 6, background: "#222", color: "#aaa", fontSize: 11, border: "none", cursor: "pointer" }}>Modifier</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
