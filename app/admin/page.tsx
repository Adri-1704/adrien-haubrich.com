"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("ah-admin-theme") !== "light";
  });
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("ah-admin-theme", next ? "dark" : "light");
  };

  // Theme classes
  const t = {
    bg: darkMode ? "bg-[#0a0a0a]" : "bg-gray-50",
    text: darkMode ? "text-white" : "text-gray-900",
    card: darkMode ? "border-white/5 bg-[#111]" : "border-gray-200 bg-white",
    cardHover: darkMode ? "hover:border-white/10" : "hover:border-gray-300",
    sub: darkMode ? "text-neutral-500" : "text-gray-500",
    sub2: darkMode ? "text-neutral-400" : "text-gray-600",
    input: darkMode ? "border-white/10 bg-white/5 text-white placeholder-neutral-500 focus:border-white/25" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500",
    inputGreen: darkMode ? "border-white/10 bg-white/5 text-emerald-400 focus:border-emerald-500/50" : "border-gray-300 bg-white text-emerald-600 focus:border-emerald-500",
    inputRed: darkMode ? "border-white/10 bg-white/5 text-red-400 focus:border-red-500/50" : "border-gray-300 bg-white text-red-600 focus:border-red-500",
    inputNote: darkMode ? "border-white/10 bg-white/5 text-neutral-400 focus:border-white/25" : "border-gray-300 bg-white text-gray-600 focus:border-violet-500",
    header: darkMode ? "border-white/5" : "border-gray-200 bg-white",
    monthBtn: darkMode ? "bg-white/5 text-neutral-500 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
    monthActive: darkMode ? "bg-white text-black" : "bg-violet-600 text-white",
    monthHasData: darkMode ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    chartBar: darkMode ? "bg-white/20" : "bg-gray-200",
    chartBarEmpty: darkMode ? "bg-white/5" : "bg-gray-100",
    chartActive: "bg-emerald-500",
    gradient: darkMode ? "from-[#111] to-[#1a1a2e]" : "from-white to-violet-50",
  };

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

  // All months data from server
  const [allMonthsData, setAllMonthsData] = useState<Record<string, Record<string, ProjectData>>>({});
  const [synced, setSynced] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const passwordRef = useRef("");

  const monthData = allMonthsData[selectedMonthKey] || {};

  // Load localStorage data
  function loadAllLocal(): Record<string, Record<string, ProjectData>> {
    const local: Record<string, Record<string, ProjectData>> = {};
    for (let m = 0; m < 12; m++) {
      const mk = getMonthKey(currentYear, m);
      const d = loadMonthData(mk);
      if (Object.keys(d).length > 0) local[mk] = d;
    }
    return local;
  }

  // Load data: merge localStorage + Supabase (localStorage wins if Supabase is empty)
  useEffect(() => {
    if (!authenticated || synced) return;
    const local = loadAllLocal();
    const pwd = passwordRef.current || sessionStorage.getItem("ah-admin-pwd") || "";

    fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd, action: "load" }),
    })
      .then((r) => r.json())
      .then((data) => {
        const remote = (data.months || {}) as Record<string, Record<string, ProjectData>>;
        const hasRemote = Object.keys(remote).length > 0;
        const hasLocal = Object.keys(local).length > 0;

        if (hasRemote) {
          // Merge: remote wins, but fill gaps with local
          const merged = { ...local, ...remote };
          setAllMonthsData(merged);
          // Cache merged data locally
          for (const [mk, d] of Object.entries(merged)) {
            saveMonthData(mk, d);
          }
        } else if (hasLocal) {
          // Supabase is empty, use local and sync up
          setAllMonthsData(local);
          // Upload local data to Supabase
          for (const [mk, d] of Object.entries(local)) {
            fetch("/api/admin/data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: pwd, action: "save", monthKey: mk, data: d }),
            }).catch(() => {});
          }
        }
        setSynced(true);
      })
      .catch(() => {
        setAllMonthsData(local);
        setSynced(true);
      });
  }, [authenticated, synced, currentYear]);

  const switchMonth = useCallback((month: number) => {
    setSelectedMonth(month);
  }, [currentYear]);

  function saveToServer(mk: string, data: Record<string, ProjectData>) {
    const pwd = passwordRef.current || sessionStorage.getItem("ah-admin-pwd") || "";
    fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd, action: "save", monthKey: mk, data }),
    }).catch(() => {});
  }

  function updateProject(projectName: string, field: keyof ProjectData, value: number | string) {
    const updated = { ...monthData };
    if (!updated[projectName]) updated[projectName] = { revenue: 0, expenses: 0, notes: "" };
    (updated[projectName] as unknown as Record<string, unknown>)[field] = value;

    const newAll = { ...allMonthsData, [selectedMonthKey]: updated };
    setAllMonthsData(newAll);
    saveMonthData(selectedMonthKey, updated);

    // Debounce save to server
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveToServer(selectedMonthKey, updated), 500);
  }

  function getProjectData(name: string): ProjectData {
    return monthData[name] || { revenue: 0, expenses: 0, notes: "" };
  }

  const salaryData = getProjectData("__salary__");

  function updateSalary(field: keyof ProjectData, value: number | string) {
    updateProject("__salary__", field, value);
  }

  // Fixed charges (stored in localStorage, synced)
  interface FixedCharge { name: string; amount: number; }
  const fixedChargesRaw = getProjectData("__fixed_charges__");
  const fixedCharges: FixedCharge[] = (() => {
    try {
      if (fixedChargesRaw.notes) return JSON.parse(fixedChargesRaw.notes);
    } catch { /* ignore */ }
    return [];
  })();
  const totalFixedCharges = fixedCharges.reduce((s, c) => s + c.amount, 0);

  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");

  function addFixedCharge() {
    const amt = parseFloat(newChargeAmount);
    if (!newChargeName.trim() || isNaN(amt) || amt <= 0) return;
    const updated = [...fixedCharges, { name: newChargeName.trim(), amount: amt }];
    updateProject("__fixed_charges__", "notes", JSON.stringify(updated));
    setNewChargeName("");
    setNewChargeAmount("");
  }

  function removeFixedCharge(index: number) {
    const updated = fixedCharges.filter((_, i) => i !== index);
    updateProject("__fixed_charges__", "notes", JSON.stringify(updated));
  }

  // Totals for selected month
  const monthTotalRevenue = PROJECT_DEFS.reduce((s, p) => s + getProjectData(p.name).revenue, 0);
  const monthTotalExpenses = PROJECT_DEFS.reduce((s, p) => s + getProjectData(p.name).expenses, 0) + totalFixedCharges;
  const monthSalary = salaryData.revenue;
  const monthTotalIncome = monthTotalRevenue + monthSalary;
  const monthMargin = monthTotalIncome - monthTotalExpenses;

  // Year totals
  const yearTotals = { revenue: 0, expenses: 0, salary: 0, fixedCharges: 0 };
  for (let m = 0; m < 12; m++) {
    const mk = getMonthKey(currentYear, m);
    const data = allMonthsData[mk] || {};
    for (const p of PROJECT_DEFS) {
      const pd = data[p.name];
      if (pd) {
        yearTotals.revenue += pd.revenue || 0;
        yearTotals.expenses += pd.expenses || 0;
      }
    }
    const sal = data["__salary__"];
    if (sal) yearTotals.salary += sal.revenue || 0;
    // Fixed charges apply every month that has any data
    const hasData = Object.keys(data).length > 0;
    if (hasData) yearTotals.fixedCharges += totalFixedCharges;
  }

  // Monthly revenue breakdown for chart
  const monthlyRevenues = Array.from({ length: 12 }, (_, m) => {
    const mk = getMonthKey(currentYear, m);
    const data = allMonthsData[mk] || {};
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
      passwordRef.current = password;
      sessionStorage.setItem("ah-admin-auth", "1");
      sessionStorage.setItem("ah-admin-pwd", password);
      sessionStorage.setItem("ah-admin-stripe", JSON.stringify(data.stripe));
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${t.bg} px-6`}>
        <div className="w-full max-w-sm">
          <h1 className={`mb-2 text-2xl font-bold ${t.text} text-center`}>Admin</h1>
          <p className={`mb-6 text-sm ${t.sub} text-center`}>Tableau de bord — Adrien Haubrich</p>
          <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className={`w-full rounded-lg border ${t.input} px-4 py-3 text-base outline-none`}
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
    <div className={`min-h-screen ${t.bg} ${t.text} overflow-x-hidden`}>
      <header className={`sticky top-0 z-40 border-b ${t.header} px-4 sm:px-6 py-3`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold">Admin — Adrien Haubrich</h1>
          <div className="flex items-center gap-3">
            <a href="/admin/meetings" className={`rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-neutral-200 no-underline`}>
              🗓️ Mes RDV
            </a>
            <a href="/admin/crm" className={`rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-neutral-200 no-underline`}>
              🤖 Mon CRM
            </a>
            <button
              onClick={() => {
                const local = loadAllLocal();
                const pwd = passwordRef.current || sessionStorage.getItem("ah-admin-pwd") || "";
                let count = 0;
                for (const [mk, d] of Object.entries(local)) {
                  if (Object.keys(d).length > 0) {
                    fetch("/api/admin/data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: pwd, action: "save", monthKey: mk, data: d }),
                    }).then(() => { count++; if (count === Object.keys(local).length) alert("Synchronisation terminée !"); });
                  }
                }
                if (Object.keys(local).length === 0) alert("Aucune donnée locale à synchroniser");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${t.monthBtn}`}
              title="Synchroniser vers le serveur"
            >
              Sync
            </button>
            <button onClick={toggleTheme} className={`rounded-lg p-2 ${t.sub} transition-colors`} title={darkMode ? "Mode clair" : "Mode sombre"}>
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button onClick={() => { setAuthenticated(false); setSynced(false); sessionStorage.removeItem("ah-admin-auth"); sessionStorage.removeItem("ah-admin-pwd"); sessionStorage.removeItem("ah-admin-stripe"); }} className={`text-sm ${t.sub}`}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">

        {/* ─── Month Selector ─── */}
        <div id="month-selector" className="grid grid-cols-4 sm:grid-cols-12 gap-1.5 scroll-mt-16">
          {MONTH_NAMES.map((name, i) => {
            const hasData = Object.keys(allMonthsData[getMonthKey(currentYear, i)] || {}).length > 0;
            return (
              <button
                key={i}
                onClick={() => switchMonth(i)}
                className={`rounded-lg py-2 text-xs font-medium transition-all ${
                  i === selectedMonth
                    ? t.monthActive
                    : hasData
                      ? t.monthHasData
                      : t.monthBtn
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* ─── Summary for selected month ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider ${t.sub}">
            {MONTH_NAMES_FULL[selectedMonth]} {currentYear}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className={`rounded-xl border ${t.card} p-5`}>
              <p className={`text-xs ${t.sub} mb-1`}>CA projets</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCHF(monthTotalRevenue)} <span className={`text-sm ${t.sub}`}>CHF</span></p>
            </div>
            <div className={`rounded-xl border ${t.card} p-5`}>
              <p className={`text-xs ${t.sub} mb-1`}>Salaire</p>
              <p className="text-2xl font-bold text-blue-400">{formatCHF(monthSalary)} <span className={`text-sm ${t.sub}`}>CHF</span></p>
            </div>
            <div className={`rounded-xl border ${t.card} p-5`}>
              <p className={`text-xs ${t.sub} mb-1`}>Charges</p>
              <p className="text-2xl font-bold text-red-400">{formatCHF(monthTotalExpenses)} <span className={`text-sm ${t.sub}`}>CHF</span></p>
            </div>
            <div className={`rounded-xl border ${t.card} p-5`}>
              <p className={`text-xs ${t.sub} mb-1`}>Revenu total</p>
              <p className={`text-2xl font-bold ${monthMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCHF(monthMargin)} <span className={`text-sm ${t.sub}`}>CHF</span></p>
            </div>
            <div className={`rounded-xl border ${t.card} p-5`}>
              <p className={`text-xs ${t.sub} mb-1`}>Annuel {currentYear}</p>
              <p className={`text-2xl font-bold ${t.text}`}>{formatCHF(yearTotals.revenue + yearTotals.salary)} <span className={`text-sm ${t.sub}`}>CHF</span></p>
            </div>
          </div>
        </div>

        {/* ─── Yattoo / Stripe ─── */}
        {stripeData && (
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider ${t.sub}">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Yattoo — Stripe (automatique)
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">CA ce mois</p>
                <p className="text-lg font-bold text-emerald-400">{formatCHF(stripeData.monthRevenue)}</p>
              </div>
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">CA mois dernier</p>
                <p className="text-lg font-bold ${t.text}">{formatCHF(stripeData.lastMonthRevenue)}</p>
              </div>
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">CA annuel Stripe</p>
                <p className="text-lg font-bold ${t.text}">{formatCHF(stripeData.yearRevenue)}</p>
              </div>
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">MRR</p>
                <p className="text-lg font-bold text-violet-400">{formatCHF(stripeData.mrr)}</p>
              </div>
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">Abonnés actifs</p>
                <p className="text-lg font-bold ${t.text}">{stripeData.activeSubscriptions}</p>
              </div>
              <div className="rounded-xl border ${t.card} p-4">
                <p className="text-[10px] ${t.sub} mb-1">Clients total</p>
                <p className="text-lg font-bold ${t.text}">{stripeData.totalCustomers}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Salary ─── */}
        <div className={`rounded-xl border ${t.card} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <h3 className={`text-sm font-bold ${t.text}`}>Salaire</h3>
            <span className={`rounded-full border ${t.card} px-2 py-0.5 text-[10px] ${t.sub}`}>Emploi (depuis Avril 2026)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className={`block text-[10px] ${t.sub} mb-1`}>Salaire net (CHF)</label>
              <input
                type="number"
                min="0"
                value={salaryData.revenue || ""}
                onChange={(e) => updateSalary("revenue", Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className={`w-full rounded-lg border ${t.inputGreen} px-3 py-2 text-sm font-semibold outline-none`}
              />
            </div>
            <div>
              <label className={`block text-[10px] ${t.sub} mb-1`}>Notes</label>
              <input
                type="text"
                value={salaryData.notes || ""}
                onChange={(e) => updateSalary("notes", e.target.value)}
                placeholder="..."
                className={`w-full rounded-lg border ${t.inputNote} px-3 py-2 text-sm outline-none`}
              />
            </div>
            <div>
              <label className={`block text-[10px] ${t.sub} mb-1`}>Total annuel</label>
              <div className={`rounded-lg border ${t.card} px-3 py-2 text-sm font-semibold text-blue-400`}>
                {formatCHF(yearTotals.salary)}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Fixed Charges ─── */}
        <div className={`rounded-xl border ${t.card} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <h3 className={`text-sm font-bold ${t.text}`}>Charges fixes mensuelles</h3>
            <span className={`text-sm font-bold text-orange-400`}>{formatCHF(totalFixedCharges)} CHF/mois</span>
          </div>

          {/* List */}
          {fixedCharges.length > 0 && (
            <div className="space-y-2 mb-4">
              {fixedCharges.map((charge, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg border ${t.card} px-3 py-2`}>
                  <span className={`text-sm ${t.text}`}>{charge.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-orange-400">{formatCHF(charge.amount)} CHF</span>
                    <button onClick={() => removeFixedCharge(i)} className={`text-xs ${t.sub} hover:text-red-400`}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newChargeName}
              onChange={(e) => setNewChargeName(e.target.value)}
              placeholder="Ex: Loyer atelier, Assurance..."
              className={`flex-1 rounded-lg border ${t.inputNote} px-3 py-2 text-sm outline-none`}
            />
            <input
              type="number"
              min="0"
              value={newChargeAmount}
              onChange={(e) => setNewChargeAmount(e.target.value)}
              placeholder="CHF"
              className={`w-24 rounded-lg border ${t.inputRed} px-3 py-2 text-sm font-semibold outline-none`}
            />
            <button
              onClick={addFixedCharge}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              +
            </button>
          </div>
          <p className={`mt-2 text-[10px] ${t.sub}`}>Ces charges sont déduites automatiquement chaque mois de votre marge.</p>
        </div>

        {/* ─── Projects for selected month ─── */}
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider ${t.sub}">
            Projets — {MONTH_NAMES_FULL[selectedMonth]} {currentYear}
          </h2>
          <div className="space-y-3">
            {PROJECT_DEFS.map((project) => {
              const pd = getProjectData(project.name);
              const margin = pd.revenue - pd.expenses;
              return (
                <div key={project.name} className="rounded-xl border ${t.card} p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <h3 className="text-sm font-bold ${t.text}">{project.name}</h3>
                    <span className="rounded-full border ${t.card} px-2 py-0.5 text-[10px] ${t.sub}">{project.type}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] ${t.sub} mb-1">CA (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        value={pd.revenue || ""}
                        onChange={(e) => updateProject(project.name, "revenue", Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full rounded-lg border ${t.inputGreen} px-3 py-2 text-sm font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] ${t.sub} mb-1">Charges (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        value={pd.expenses || ""}
                        onChange={(e) => updateProject(project.name, "expenses", Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full rounded-lg border ${t.inputRed} px-3 py-2 text-sm font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] ${t.sub} mb-1">Marge</label>
                      <div className={`rounded-lg border ${t.card} px-3 py-2 text-sm font-semibold ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCHF(margin)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] ${t.sub} mb-1">Notes</label>
                      <input
                        type="text"
                        value={pd.notes || ""}
                        onChange={(e) => updateProject(project.name, "notes", e.target.value)}
                        placeholder="..."
                        className="w-full rounded-lg border ${t.inputNote} px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Year Chart ─── */}
        <div className={`rounded-xl border ${t.card} p-5`}>
          <p className={`text-xs ${t.sub} mb-4`}>CA mensuel tous projets — {currentYear}</p>
          <div className="flex items-end gap-1 sm:gap-2 overflow-hidden" style={{ height: 180 }}>
            {monthlyRevenues.map((amount, i) => {
              const max = Math.max(...monthlyRevenues, 1);
              const barHeight = max > 0 ? Math.round((amount / max) * 140) : 0;
              const isSelected = i === selectedMonth;
              return (
                <button
                  key={i}
                  onClick={() => switchMonth(i)}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <span className={`text-[9px] ${t.sub} mb-1 h-3`}>{amount > 0 ? formatCHF(amount).split(",")[0] : "\u00A0"}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${isSelected ? "bg-emerald-500" : amount > 0 ? (darkMode ? "bg-emerald-500/30" : "bg-emerald-200") : (darkMode ? "bg-white/5" : "bg-gray-100")}`}
                    style={{ height: Math.max(barHeight, 4) }}
                  />
                  <span className={`text-[9px] mt-1 ${isSelected ? "text-emerald-400 font-bold" : t.sub}`}>{MONTH_NAMES[i]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Revenus Total ─── */}
        <div className={`rounded-xl border ${t.card} bg-gradient-to-r ${t.gradient} p-6 text-center`}>
          <p className={`text-xs ${t.sub} mb-3`}>Revenus totaux — {currentYear}</p>
          <p className="text-4xl font-extrabold text-emerald-400">{formatCHF(yearTotals.revenue + yearTotals.salary)} <span className={`text-lg ${t.sub}`}>CHF</span></p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4 text-center">
            <div>
              <p className={`text-[10px] ${t.sub}`}>CA projets</p>
              <p className="text-sm font-bold text-emerald-400">{formatCHF(yearTotals.revenue)}</p>
            </div>
            <div>
              <p className={`text-[10px] ${t.sub}`}>Salaires</p>
              <p className="text-sm font-bold text-blue-400">{formatCHF(yearTotals.salary)}</p>
            </div>
            <div>
              <p className={`text-[10px] ${t.sub}`}>Charges + fixes</p>
              <p className="text-sm font-bold text-red-400">{formatCHF(yearTotals.expenses + yearTotals.fixedCharges)}</p>
            </div>
            <div>
              <p className={`text-[10px] ${t.sub}`}>Bénéfice net</p>
              <p className={`text-sm font-bold ${yearTotals.revenue + yearTotals.salary - yearTotals.expenses - yearTotals.fixedCharges >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCHF(yearTotals.revenue + yearTotals.salary - yearTotals.expenses - yearTotals.fixedCharges)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
