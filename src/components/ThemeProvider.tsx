"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Theme {
  id: string;
  name: string;
  colors: [string, string, string];
}

const themes: Theme[] = [
  { id: "aurora", name: "极光", colors: ["#60a5fa", "#a78bfa", "#f472b6"] },
  { id: "flame", name: "烈焰", colors: ["#fb923c", "#ef4444", "#ec4899"] },
  { id: "emerald", name: "翡翠", colors: ["#34d399", "#10b981", "#059669"] },
  { id: "nebula", name: "星云", colors: ["#c084fc", "#a855f7", "#d946ef"] },
  { id: "ocean", name: "海洋", colors: ["#22d3ee", "#3b82f6", "#6366f1"] },
  { id: "sunset", name: "日落", colors: ["#fbbf24", "#f97316", "#ef4444"] },
];

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeCtx>({
  theme: themes[0],
  setTheme: () => {},
  themes,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(themes[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ai-daily-theme");
    if (saved) {
      const found = themes.find((t) => t.id === saved);
      if (found) setThemeState(found);
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("ai-daily-theme", t.id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.id);
  }, [theme]);

  // Prevent flash by setting data-theme before hydration
  useEffect(() => {
    if (!mounted) {
      const saved = localStorage.getItem("ai-daily-theme");
      if (saved) {
        document.documentElement.setAttribute("data-theme", saved);
      }
    }
  }, [mounted]);

  // Inject a script to set theme before paint
  useEffect(() => {
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        var t = localStorage.getItem("ai-daily-theme");
        if (t) document.documentElement.setAttribute("data-theme", t);
      })();
    `;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}
