"use client";

import { useState, useEffect } from "react";
import type { NewsItem, Category } from "@/lib/data";

interface LiveNewsFeedProps {
  initialNews: NewsItem[];
  categories: Category[];
}

export default function LiveNewsFeed({ initialNews, categories }: LiveNewsFeedProps) {
  const [news, setNews] = useState(initialNews);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchLive() {
      setLoading(true);
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setNews(data.slice(0, 12));
            const now = new Date().toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            setLastUpdate(now);
          }
        }
      } catch {
        // Keep initial data on error
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Fetch live data after initial render
    fetchLive();

    // Refresh every 30 minutes
    const interval = setInterval(fetchLive, 30 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (news.length === 0) {
    return (
      <div className="glass rounded-xl p-16 text-center">
        <div className="text-4xl mb-4">📡</div>
        <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">等待数据更新</h3>
        <p className="text-sm text-[var(--text-dim)] max-w-md mx-auto leading-relaxed">
          每日自动抓取各来源最新资讯，稍后刷新页面即可查看。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">最新资讯</h2>
          {loading && (
            <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-[var(--text-dim)]">
              更新于 {lastUpdate}
            </span>
          )}
          <span className="text-xs text-[var(--text-dim)]">
            {news.length > 0 ? "最近 7 天" : ""}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item: NewsItem, i: number) => (
          <NewsCard key={item.id} item={item} index={i} categories={categories} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item, index, categories }: { item: NewsItem; index: number; categories: Category[] }) {
  const cat = categories.find((c) => c.id === item.category);
  const date = new Date(item.pubDate).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-xl p-5 card-hover block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        {cat && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${cat.color} px-2.5 py-0.5 text-[10px] font-medium text-white`}>
            {cat.icon} {cat.name}
          </span>
        )}
        <span className="text-[10px] text-[var(--text-dim)] ml-auto">{date}</span>
      </div>
      <h3 className="font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
        {item.title}
      </h3>
      {item.content && (
        <p className="mt-2 text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-2">
          {item.content}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-dim)]">
        <span className="truncate">{item.source}</span>
        <span className="text-blue-400/50 ml-auto">阅读 →</span>
      </div>
    </a>
  );
}
