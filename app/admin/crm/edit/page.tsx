"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditProspectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", contact_name: "", email: "", phone: "", instagram: "",
    city: "", canton: "", type: "restaurant", source: "manual",
    status: "new", priority: "normal", notes: "",
    last_contact_at: "", next_follow_up_at: "", follow_up_action: "",
  });

  const api = useCallback(async (action: string, extra = {}) => {
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  }, []);

  useEffect(() => {
    if (id) {
      api("get", { id }).then((data) => {
        if (data.prospect) {
          const p = data.prospect;
          setForm({
            name: p.name || "", contact_name: p.contact_name || "", email: p.email || "",
            phone: p.phone || "", instagram: p.instagram || "", city: p.city || "",
            canton: p.canton || "", type: p.type || "restaurant", source: p.source || "manual",
            status: p.status || "new", priority: p.priority || "normal", notes: p.notes || "",
            last_contact_at: p.last_contact_at?.slice(0, 10) || "",
            next_follow_up_at: p.next_follow_up_at?.slice(0, 10) || "",
            follow_up_action: p.follow_up_action || "",
          });
        }
        setLoading(false);
      });
    }
  }, [id, api]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { alert("Le nom est requis"); return; }
    setSaving(true);
    const prospect: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(form)) {
      prospect[key] = (typeof val === "string" && val.trim() === "") ? null : val;
    }
    try {
      const result = id
        ? await api("update", { id, prospect })
        : await api("create", { prospect });
      if (result.error) { alert("Erreur: " + result.error); setSaving(false); return; }
      router.push("/admin/crm");
    } catch (err) {
      alert("Erreur: " + String(err));
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Supprimer ce prospect ?")) return;
    await api("delete", { id });
    router.push("/admin/crm");
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #333", background: "#0a0a0a", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };

  if (loading) return <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>Chargement...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "20px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/admin/crm" style={{ padding: "8px 16px", borderRadius: 8, background: "#222", color: "#aaa", fontSize: 13, textDecoration: "none" }}>← CRM</Link>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isNew ? "Nouveau prospect" : form.name}</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {id && <button onClick={handleDelete} style={{ padding: "8px 16px", borderRadius: 8, background: "#dc2626", color: "white", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Supprimer</button>}
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, background: "white", color: "black", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
              {saving ? "..." : isNew ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Info */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: "#888", marginBottom: 16, marginTop: 0 }}>Informations</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Nom *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Restaurant La Grotte" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Contact</label><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Jean Dupont" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@resto.ch" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Téléphone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+41 27 455 46 46" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Instagram</label><input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@lagrotte" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Ville</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Sion" style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Canton</label>
                <select value={form.canton} onChange={e => setForm({ ...form, canton: e.target.value })} style={inputStyle}>
                  <option value="">—</option><option value="geneve">Genève</option><option value="vaud">Vaud</option><option value="valais">Valais</option><option value="fribourg">Fribourg</option><option value="neuchatel">Neuchâtel</option><option value="jura">Jura</option><option value="berne">Berne</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: "#888", marginBottom: 16, marginTop: 0 }}>Pipeline</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Statut</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  <option value="new">Nouveau</option><option value="contacted">Contacté</option><option value="replied">Répondu</option><option value="meeting">RDV</option><option value="trial">Essai</option><option value="paying">Payant</option><option value="lost">Perdu</option>
                </select>
              </div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Priorité</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  <option value="hot">🔥 Chaud</option><option value="normal">Normal</option><option value="low">Basse</option>
                </select>
              </div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  <option value="restaurant">Restaurant</option><option value="partner">Partenaire</option><option value="influencer">Influenceur</option>
                </select>
              </div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Source</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={inputStyle}>
                  <option value="manual">Manuel</option><option value="call">Appel</option><option value="brevo">Brevo</option><option value="insta_dm">DM Insta</option><option value="partner_email">Email partenariat</option><option value="terrain">Terrain</option><option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Prochaine relance</label><input type="date" value={form.next_follow_up_at} onChange={e => setForm({ ...form, next_follow_up_at: e.target.value })} style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>Action prévue</label>
                <select value={form.follow_up_action} onChange={e => setForm({ ...form, follow_up_action: e.target.value })} style={inputStyle}>
                  <option value="">—</option><option value="relance_email">Relance email</option><option value="appel">Appel</option><option value="rdv">Prendre RDV</option><option value="envoyer_offre">Envoyer offre</option><option value="demo">Démo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, color: "#888", marginBottom: 16, marginTop: 0 }}>Notes</h3>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Notes libres..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </form>
      </div>
    </div>
  );
}
