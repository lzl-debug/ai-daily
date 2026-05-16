"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Theme {
  id: string;
  name: string;
  mode: "dark" | "light";
  colors: [string, string, string];
}

const themes: Theme[] = [
  // Dark themes
  { id: "aurora", name: "极光", mode: "dark", colors: ["#60a5fa", "#a78bfa", "#f472b6"] },
  { id: "flame", name: "烈焰", mode: "dark", colors: ["#fb923c", "#ef4444", "#ec4899"] },
  { id: "emerald", name: "翡翠", mode: "dark", colors: ["#34d399", "#10b981", "#059669"] },
  { id: "nebula", name: "星云", mode: "dark", colors: ["#c084fc", "#a855f7", "#d946ef"] },
  { id: "ocean", name: "海洋", mode: "dark", colors: ["#22d3ee", "#3b82f6", "#6366f1"] },
  { id: "sunset", name: "日落", mode: "dark", colors: ["#fbbf24", "#f97316", "#ef4444"] },
  // Light themes
  { id: "aurora", name: "极光", mode: "light", colors: ["#60a5fa", "#a78bfa", "#f472b6"] },
  { id: "flame", name: "烈焰", mode: "light", colors: ["#fb923c", "#ef4444", "#ec4899"] },
  { id: "emerald", name: "翡翠", mode: "light", colors: ["#34d399", "#10b981", "#059669"] },
  { id: "nebula", name: "星云", mode: "light", colors: ["#c084fc", "#a855f7", "#d946ef"] },
  { id: "ocean", name: "海洋", mode: "light", colors: ["#22d3ee", "#3b82f6", "#6366f1"] },
  { id: "sunset", name: "日落", mode: "light", colors: ["#fbbf24", "#f97316", "#ef4444"] },
];

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: Theme[];
}

function findTheme(id: string, mode: "dark" | "light"): Theme {
  const found = themes.find((t) => t.id === id && t.mode === mode);
  return found || themes[0];
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

  // Restore saved theme on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ai-daily-theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle legacy format (just a theme id string)
        if (typeof parsed === "string") {
          const found = themes.find((t) => t.id === parsed && t.mode === "dark");
          if (found) setThemeState(found);
        } else {
          const found = findTheme(parsed.id, parsed.mode);
          setThemeState(found);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("ai-daily-theme", JSON.stringify({ id: t.id, mode: t.mode }));
  }, []);

  // Sync data attributes
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", theme.mode);
    document.documentElement.setAttribute("data-theme", theme.id);
  }, [theme]);

  // Prevent flash by setting attributes before hydration
  useEffect(() => {
    if (!mounted) {
      const saved = localStorage.getItem("ai-daily-theme");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed === "string") {
            document.documentElement.setAttribute("data-mode", "dark");
            document.documentElement.setAttribute("data-theme", parsed);
          } else {
            document.documentElement.setAttribute("data-mode", parsed.mode || "dark");
            document.documentElement.setAttribute("data-theme", parsed.id);
          }
        } catch {
          document.documentElement.setAttribute("data-mode", "dark");
        }
      }
    }
  }, [mounted]);

  // Inject inline script to set theme before first paint
  useEffect(() => {
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        try {
          var s = localStorage.getItem("ai-daily-theme");
          if (s) {
            var p = JSON.parse(s);
            if (typeof p === "string") {
              document.documentElement.setAttribute("data-mode", "dark");
              document.documentElement.setAttribute("data-theme", p);
            } else {
              document.documentElement.setAttribute("data-mode", p.mode || "dark");
              document.documentElement.setAttribute("data-theme", p.id);
            }
          } else {
            document.documentElement.setAttribute("data-mode", "dark");
          }
        } catch(e) {
          document.documentElement.setAttribute("data-mode", "dark");
        }
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
