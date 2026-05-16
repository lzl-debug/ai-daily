import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Daily - 每日 AI 资讯聚合",
  description: "每日精选 AI 领域前沿资讯，覆盖前端、后端、研究、工具等方向",
  openGraph: {
    title: "AI Daily - 每日 AI 资讯聚合",
    description: "每日精选 AI 领域前沿资讯",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg-primary)" }}>
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--header-bg)",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="logo-bg flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white transition-colors duration-500">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="gradient-text">AI</span>
            <span style={{ color: "var(--text-secondary)" }}> Daily</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="flex items-center rounded-lg px-2.5 py-1.5 text-sm transition-all"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="搜索"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </Link>
          <ThemeSwitcher />
          <span
            className="hidden sm:flex items-center gap-1 text-xs rounded-full px-3 py-1.5"
            style={{
              color: "var(--text-dim)",
              backgroundColor: "var(--badge-bg)",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            每日更新
          </span>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p style={{ color: "var(--text-dim)" }} className="text-sm">
            AI Daily — 每日 AI 资讯聚合平台
          </p>
          <p style={{ color: "var(--text-faint)" }} className="text-xs">
            数据来源：各 AI 公司官方博客、arXiv、Product Hunt、GitHub Trending 等
          </p>
        </div>
      </div>
    </footer>
  );
}
