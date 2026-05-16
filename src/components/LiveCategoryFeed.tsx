"use client";

import { useState, useEffect } from "react";
import type { NewsItem, Category } from "@/lib/data";

interface LiveCategoryFeedProps {
  initialNews: NewsItem[];
  categoryId: string;
}

export default function LiveCategoryFeed({ initialNews, categoryId }: LiveCategoryFeedProps) {
  const [news, setNews] = useState(initialNews);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchLive() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${categoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setNews(data);
        }
      } catch {
        // Keep initial data on error
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 30 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [categoryId]);

  if (news.length === 0) {
    return (
      <div className="glass rounded-xl p-16 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-white/60 mb-2">暂无资讯</h3>
        <p className="text-sm text-white/30 max-w-md mx-auto leading-relaxed">
          该分类下还没有内容，等待数据自动更新...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-xs text-white/30">
          {news.length} 条资讯
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item: NewsItem, i: number) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-5 card-hover block"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-white/30">
                {new Date(item.pubDate).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-[10px] text-white/20 truncate ml-auto">
                {item.source}
              </span>
            </div>
            <h3 className="font-medium text-white/85 leading-snug line-clamp-2">
              {item.title}
            </h3>
            {item.content && (
              <p className="mt-2 text-xs text-white/40 leading-relaxed line-clamp-3">
                {item.content}
              </p>
            )}
            <div className="mt-3 text-xs text-blue-400/50">
              阅读原文 →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
