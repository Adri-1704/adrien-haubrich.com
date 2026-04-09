"use client";

import { useState, useCallback } from "react";

const MONTH_NAMES_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
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

interface ProjectData {
  revenue: number;
  expenses: number;
  notes: string;
}

const PROJECT_DEFS = [
  { name: "Yattoo.io", color: "#22c55e", type: "SaaS B2C + Stripe" },
  { name: "FunkyFeet.ch", color: "#7c3aed", type: "Shopify" },
  { name: "LatelierSuisse.ch", color: "#dc2626", type: "Shopify" },
  { name: "LatelierSuisse.co (B2B)", color: "#991b1b", type: "Factures" },
  { name: "Merciinternet.ch", color: "#7C3AED", type: "SaaS (bientôt)" },
  { name: "OnVousTrouve.ch", color: "#1e40af", type: "Agence web" },
  { name: "Just-Tag.ch", color: "#ea580c", type: "SaaS" },
];

function formatCHF(amount: number): string {
  return amount.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function loadMonthData(monthKey: string): Record<string, ProjectData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`ah-admin-${monthKey}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveMonthData(monthKey: string, data: Record<string, ProjectData>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`ah-admin-${monthKey}`, JSON.stringify(data));
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("ah-admin-auth") === "1";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stripeData, setStripeData] = useState<StripeData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem("ah-admin-stripe");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const selectedMonthKey = getMonthKey(currentYear, selectedMonth);

  const [monthData, setMonthData] = useState<Record<string, ProjectData>>(() => loadMonthData(getMonthKey(currentYear, now.getMonth())));

  const switchMonth = useCallback((month: number) => {
    setSelectedMonth(month);
    setMonthData(loadMonthData(getMonthKey(currentYear, month)));
  }, [currentYear]);

  function updateProject(projectName: string, field: keyof ProjectData, value: number | string) {
    const updated = { ...monthData };
    if (!updated[projectName]) updated[projectName] = { revenue: 0, expenses: 0, notes: "" };
    (updated[projectName] as Record<string, unknown>)[field] = value;
    setMonthData(updated);
    saveMonthData(selectedMonthKey, updated);
  }

  function getProjectData(name: string): ProjectData {
    return monthData[name] || { revenue: 0, expenses: 0, notes: "" };
  }

  // Totals for selected month
  const monthTotalRevenue = PROJECT_DEFS.reduce((s, p) => s + getProjectData(p.name).revenue, 0);
  const monthTotalExpenses = PROJECT_DEFS.reduce((s, p) => s + getProjectData(p.name).expenses, 0);
  const monthMargin = monthTotalRevenue - monthTotalExpenses;

  // Year totals
  const yearTotals = { revenue: 0, expenses: 0 };
  for (let m = 0; m < 12; m++) {
    const data = loadMonthData(getMonthKey(currentYear, m));
    for (const p of PROJECT_DEFS) {
      const pd = data[p.name];
      if (pd) {
        yearTotals.revenue += pd.revenue || 0;
        yearTotals.expenses += pd.expenses || 0;
      }
    }
  }

  // Monthly revenue breakdown for chart
  const monthlyRevenues = Array.from({ length: 12 }, (_, m) => {
    const data = loadMonthData(getMonthKey(currentYear, m));
    return PROJECT_DEFS.reduce((s, p) => s + (data[p.name]?.revenue || 0), 0);
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
      sessionStorage.setItem("ah-admin-auth", "1");
      sessionStorage.setItem("ah-admin-stripe", JSON.stringify(data.stripe));
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

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
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50">
              {loading ? "Chargement..." : "Connexion"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold">Admin — Adrien Haubrich</h1>
          <button onClick={() => { setAuthenticated(false); sessionStorage.removeItem("ah-admin-auth"); sessionStorage.removeItem("ah-admin-stripe"); }} className="text-sm text-neutral-500 hover:text-white">
            Déconnexion
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* ─── Month Selector ─── */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {MONTH_NAMES.map((name, i) => {
            const hasData = Object.keys(loadMonthData(getMonthKey(currentYear, i))).length > 0;
            return (
              <button
                key={i}
                onClick={() => switchMonth(i)}
                className={`rounded-lg py-2 text-xs font-medium transition-all ${
                  i === selectedMonth
                    ? "bg-white text-black"
                    : hasData
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      : "bg-white/5 text-neutral-500 hover:bg-white/10"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* ─── Summary for selected month ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
            {MONTH_NAMES_FULL[selectedMonth]} {currentYear}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">CA du mois</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCHF(monthTotalRevenue)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">Charges du mois</p>
              <p className="text-2xl font-bold text-red-400">{formatCHF(monthTotalExpenses)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">Marge</p>
              <p className={`text-2xl font-bold ${monthMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCHF(monthMargin)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
            <div className="rounded-xl border border-white/5 bg-[#111] p-5">
              <p className="text-xs text-neutral-500 mb-1">CA annuel {currentYear}</p>
              <p className="text-2xl font-bold text-white">{formatCHF(yearTotals.revenue)} <span className="text-sm text-neutral-500">CHF</span></p>
            </div>
          </div>
        </div>

        {/* ─── Yattoo / Stripe ─── */}
        {stripeData && (
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Yattoo — Stripe (automatique)
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
                <p className="text-[10px] text-neutral-500 mb-1">CA annuel Stripe</p>
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
          </div>
        )}

        {/* ─── Projects for selected month ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-neutral-500">
            Projets — {MONTH_NAMES_FULL[selectedMonth]} {currentYear}
          </h2>
          <div className="space-y-3">
            {PROJECT_DEFS.map((project) => {
              const pd = getProjectData(project.name);
              const margin = pd.revenue - pd.expenses;
              return (
                <div key={project.name} className="rounded-xl border border-white/5 bg-[#111] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <h3 className="text-sm font-bold text-white">{project.name}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-neutral-500">{project.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">CA (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        value={pd.revenue || ""}
                        onChange={(e) => updateProject(project.name, "revenue", Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-400 font-semibold outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">Charges (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        value={pd.expenses || ""}
                        onChange={(e) => updateProject(project.name, "expenses", Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-red-400 font-semibold outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">Marge</label>
                      <div className={`rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm font-semibold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCHF(margin)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-1">Notes</label>
                      <input
                        type="text"
                        value={pd.notes || ""}
                        onChange={(e) => updateProject(project.name, "notes", e.target.value)}
                        placeholder="..."
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-400 outline-none focus:border-white/25"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Year Chart ─── */}
        <div className="rounded-xl border border-white/5 bg-[#111] p-5">
          <p className="text-xs text-neutral-500 mb-4">CA mensuel tous projets — {currentYear}</p>
          <div className="flex items-end gap-1 h-40">
            {monthlyRevenues.map((amount, i) => {
              const max = Math.max(...monthlyRevenues, 1);
              const height = max > 0 ? (amount / max) * 100 : 0;
              const isSelected = i === selectedMonth;
              return (
                <button
                  key={i}
                  onClick={() => switchMonth(i)}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] text-neutral-500">{amount > 0 ? Math.round(amount) : ""}</span>
                  <div
                    className={`w-full rounded-t transition-all ${isSelected ? "bg-emerald-500" : amount > 0 ? "bg-white/20" : "bg-white/5"}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className={`text-[9px] ${isSelected ? "text-emerald-400 font-bold" : "text-neutral-600"}`}>{MONTH_NAMES[i]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CA Total ─── */}
        <div className="rounded-xl border border-white/5 bg-gradient-to-r from-[#111] to-[#1a1a2e] p-6 text-center">
          <p className="text-xs text-neutral-500 mb-3">Chiffre d&apos;affaires total — {currentYear}</p>
          <p className="text-4xl font-extrabold text-emerald-400">{formatCHF(yearTotals.revenue)} <span className="text-lg text-neutral-500">CHF</span></p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] text-neutral-500">Charges totales</p>
              <p className="text-sm font-bold text-red-400">{formatCHF(yearTotals.expenses)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">Marge nette annuelle</p>
              <p className={`text-sm font-bold ${yearTotals.revenue - yearTotals.expenses >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCHF(yearTotals.revenue - yearTotals.expenses)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
