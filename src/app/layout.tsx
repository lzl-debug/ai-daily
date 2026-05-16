import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
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
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="gradient-text">AI</span>
            <span className="text-white/70"> Daily</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <span className="hidden sm:flex items-center gap-1 text-xs text-white/30 bg-white/5 px-3 py-1.5 rounded-full">
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
    <footer className="border-t border-white/5 mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-white/30">
            AI Daily — 每日 AI 资讯聚合平台
          </p>
          <p className="text-xs text-white/20">
            数据来源：各 AI 公司官方博客、arXiv、Product Hunt、GitHub Trending 等
          </p>
        </div>
      </div>
    </footer>
  );
}
