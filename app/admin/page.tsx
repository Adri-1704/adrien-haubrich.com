"use client";

import { useState } from "react";

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

interface StripeData {
  monthRevenue: number;
  lastMonthRevenue: number;
  yearRevenue: number;
  mrr: number;
  activeSubscriptions: number;
  totalCustomers: number;
  monthlyBreakdown: number[];
}

interface ManualProject {
  name: string;
  color: string;
  type: string;
  monthRevenue: number;
  monthExpenses: number;
  notes: string;
}

const PROJECTS: ManualProject[] = [
  { name: "Yattoo.io", color: "#22c55e", type: "SaaS B2C + Stripe", monthRevenue: 0, monthExpenses: 0, notes: "" },
  { name: "FunkyFeet.ch", color: "#7c3aed", type: "Shopify", monthRevenue: 0, monthExpenses: 0, notes: "" },
  { name: "LatelierSuisse.ch", color: "#dc2626", type: "Shopify", monthRevenue: 0, monthExpenses: 0, notes: "" },
  { name: "LatelierSuisse.co (B2B)", color: "#991b1b", type: "Factures", monthRevenue: 0, monthExpenses: 0, notes: "" },
  { name: "Merciinternet.ch", color: "#7C3AED", type: "SaaS (bientôt)", monthRevenue: 0, monthExpenses: 0, notes: "" },
  { name: "OnVousTrouve.ch", color: "#1e40af", type: "Agence web", monthRevenue: 0, monthExpenses: 0, notes: "" },
];

function formatCHF(amount: number): string {
  return amount.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stripeData, setStripeData] = useState<StripeData | null>(null);
  const [manualProjects, setManualProjects] = useState<ManualProject[]>(() => {
    if (typeof window === "undefined") return PROJECTS;
    try {
      const saved = localStorage.getItem("ah-admin-manual");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return PROJECTS;
  });

  async function login() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); setLoading(false); return; }
      setStripeData(data.stripe);
      setAuthenticated(true);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  function updateManualProject(index: number, field: keyof ManualProject, value: string | number) {
    const updated = [...manualProjects];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setManualProjects(updated);
    localStorage.setItem("ah-admin-manual", JSON.stringify(updated));
  }

  // Totals
  const manualTotalRevenue = manualProjects.reduce((s, p) => s + p.monthRevenue, 0);
  const manualTotalExpenses = manualProjects.reduce((s, p) => s + p.monthExpenses, 0);
  const stripeMonthRevenue = stripeData?.monthRevenue || 0;
  const totalMonthRevenue = stripeMonthRevenue + manualTotalRevenue;
  const totalMonthExpenses = manualTotalExpenses;
  const totalMargin = totalMonthRevenue - totalMonthExpenses;

  // Login screen
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-bold text-white text-center">Admin</h1>
          <p className="mb-6 text-sm text-neutral-500 text-center">Tableau de bord — Adrien Haubrich</p>
          <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-neutral-500 outline-none focus:border-white/25"
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Connexion"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold">Admin — Adrien Haubrich</h1>
          <button onClick={() => setAuthenticated(false)} className="text-sm text-neutral-500 hover:text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* ─── Global Summary ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">Vue d&apos;ensemble — Ce mois</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">CA total du mois</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCHF(totalMonthRevenue)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">Charges du mois</p>
              <p className="text-2xl font-bold text-red-400">{formatCHF(totalMonthExpenses)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">Marge</p>
              <p className={`text-2xl font-bold ${totalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCHF(totalMargin)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">Projets actifs</p>
              <p className="text-2xl font-bold text-white">{manualProjects.length + 1}</p>
            </div>
          </div>
        </div>

        {/* ─── Yattoo / Stripe ─── */}
        {stripeData && (
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Yattoo — Stripe
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">CA ce mois</p>
                <p className="text-lg font-bold text-emerald-400">{formatCHF(stripeData.monthRevenue)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">CA mois dernier</p>
                <p className="text-lg font-bold text-white">{formatCHF(stripeData.lastMonthRevenue)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">CA annuel</p>
                <p className="text-lg font-bold text-white">{formatCHF(stripeData.yearRevenue)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">MRR</p>
                <p className="text-lg font-bold text-violet-400">{formatCHF(stripeData.mrr)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">Abonnés actifs</p>
                <p className="text-lg font-bold text-white">{stripeData.activeSubscriptions}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#111] p-4">
                <p className="text-[10px] text-neutral-500 mb-1">Clients total</p>
                <p className="text-lg font-bold text-white">{stripeData.totalCustomers}</p>
              </div>
            </div>

            {/* Monthly chart */}
            <div className="mt-4 rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-4">CA mensuel {new Date().getFullYear()}</p>
              <div className="flex items-end gap-1 h-32">
                {stripeData.monthlyBreakdown.map((amount, i) => {
                  const max = Math.max(...stripeData.monthlyBreakdown, 1);
                  const height = max > 0 ? (amount / max) * 100 : 0;
                  const isCurrent = i === new Date().getMonth();
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-neutral-500">{amount > 0 ? Math.round(amount) : ""}</span>
                      <div
                        className={`w-full rounded-t transition-all ${isCurrent ? "bg-emerald-500" : "bg-white/10"}`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <span className={`text-[9px] ${isCurrent ? "text-emerald-400 font-bold" : "text-neutral-600"}`}>{MONTH_NAMES[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Other Projects (manual) ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">Autres projets — Saisie manuelle</h2>
          <p className="mb-4 text-xs text-neutral-600">Les données Shopify seront automatiques une fois les clés API configurées.</p>
          <div className="space-y-3">
            {manualProjects.map((project, i) => (
              <div key={project.name} className="rounded-xl border border-white/5 bg-[#111] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-sm font-bold text-white">{project.name}</h3>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-500">{project.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">CA du mois (CHF)</label>
                    <input
                      type="number"
                      value={project.monthRevenue || ""}
                      onChange={(e) => updateManualProject(i, "monthRevenue", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-400 font-semibold outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">Charges du mois (CHF)</label>
                    <input
                      type="number"
                      value={project.monthExpenses || ""}
                      onChange={(e) => updateManualProject(i, "monthExpenses", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-red-400 font-semibold outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">Marge</label>
                    <div className={`rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm font-semibold ${project.monthRevenue - project.monthExpenses >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCHF(project.monthRevenue - project.monthExpenses)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-1">Notes</label>
                    <input
                      type="text"
                      value={project.notes}
                      onChange={(e) => updateManualProject(i, "notes", e.target.value)}
                      placeholder="..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-400 outline-none focus:border-white/25"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Objectif ─── */}
        <div className="rounded-xl border border-white/5 bg-[#111] p-6 text-center">
          <p className="text-xs text-neutral-500 mb-2">Objectif : 10&apos;000 CHF / mois</p>
          <div className="mx-auto max-w-md">
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all"
                style={{ width: `${Math.min((totalMonthRevenue / 10000) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-bold text-white">
              {formatCHF(totalMonthRevenue)} / 10&apos;000 CHF
              <span className="ml-2 text-neutral-500">({Math.round((totalMonthRevenue / 10000) * 100)}%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
