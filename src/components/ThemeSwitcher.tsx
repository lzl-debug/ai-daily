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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        aria-label="切换主题"
      >
        <span className="flex gap-0.5">
          {theme.colors.map((c, i) => (
            <span key={i} className="inline-block w-2 h-2 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="hidden sm:inline">{theme.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#1a1a25] p-2 shadow-2xl backdrop-blur-xl z-50">
          <p className="px-2 py-1.5 text-[10px] text-white/30 font-medium tracking-wider uppercase">
            主题配色
          </p>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t); setOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all ${
                t.id === theme.id
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex gap-0.5">
                {t.colors.map((c, i) => (
                  <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
              {t.name}
              {t.id === theme.id && (
                <span className="ml-auto text-[10px] text-white/40">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
