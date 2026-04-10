"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ThemeContext = createContext({ dark: true, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeWrapper({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ah-theme");
    if (saved === "light") setDark(false);
    setMounted(true);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("ah-theme", next ? "dark" : "light");
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className={dark ? "theme-dark" : "theme-light"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
