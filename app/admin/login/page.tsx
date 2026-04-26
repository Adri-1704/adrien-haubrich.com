"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Mot de passe incorrect");
        setLoading(false);
        return;
      }
      // Mirror legacy sessionStorage so old admin pages stay happy
      sessionStorage.setItem("ah-admin-auth", "1");
      sessionStorage.setItem("ah-admin-pwd", password);
      const redirect = searchParams.get("redirect") || "/admin";
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: 24 }}>
      <form onSubmit={handleLogin} style={{ width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔐</div>
          <h1 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 700 }}>Admin — Adrien Haubrich</h1>
          <p style={{ color: "#666", marginTop: 6, fontSize: 13 }}>Une connexion pour toutes les pages admin</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "8px 0 0", textAlign: "center" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 10, background: "white", color: "black", fontWeight: 600, fontSize: 14, border: "none", cursor: loading ? "wait" : "pointer", opacity: loading || !password ? 0.5 : 1 }}
        >
          {loading ? "..." : "Connexion"}
        </button>
        <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 24 }}>
          Session valide 30 jours · Cookie sécurisé
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <LoginForm />
    </Suspense>
  );
}
