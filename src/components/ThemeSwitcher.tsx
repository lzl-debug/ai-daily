"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDismiss(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDismiss);
    return () => document.removeEventListener("mousedown", onDismiss);
  }, [open]);

  const darkThemes = themes.filter((t) => t.mode === "dark");
  const lightThemes = themes.filter((t) => t.mode === "light");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all"
        aria-label="切换主题"
      >
        <span className="flex gap-0.5">
          {theme.colors.map((c, i) => (
            <span key={i} className="inline-block w-2 h-2 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="hidden sm:inline">
          {theme.mode === "dark" ? "暗色" : "浅色"} · {theme.name}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] p-2 shadow-2xl backdrop-blur-xl z-50"
          style={{ background: "var(--bg-elevated)" }}
        >
          {/* Dark section */}
          <p className="px-2 py-1.5 text-[10px] text-[var(--text-dim)] font-medium tracking-wider uppercase">
            暗色主题
          </p>
          {darkThemes.map((t) => (
            <button
              key={t.id + t.mode}
              onClick={() => { setTheme(t); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                t.id === theme.id && theme.mode === "dark"
                  ? "bg-[var(--hover-bg-strong)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
              }`}
            >
              <span className="flex gap-0.5">
                {t.colors.map((c, i) => (
                  <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
              {t.name}
              {t.id === theme.id && theme.mode === "dark" && (
                <span className="ml-auto text-[10px] text-[var(--text-dim)]">✓</span>
              )}
            </button>
          ))}

          {/* Light section */}
          <div className="my-1.5 border-t border-[var(--border-subtle)]" />
          <p className="px-2 py-1.5 text-[10px] text-[var(--text-dim)] font-medium tracking-wider uppercase">
            浅色主题
          </p>
          {lightThemes.map((t) => (
            <button
              key={t.id + t.mode}
              onClick={() => { setTheme(t); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all ${
                t.id === theme.id && theme.mode === "light"
                  ? "bg-[var(--hover-bg-strong)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
              }`}
            >
              <span className="flex gap-0.5">
                {t.colors.map((c, i) => (
                  <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
              {t.name}
              {t.id === theme.id && theme.mode === "light" && (
                <span className="ml-auto text-[10px] text-[var(--text-dim)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
