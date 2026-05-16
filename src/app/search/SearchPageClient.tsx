"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SearchPageClient() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-[var(--text-dim)]">加载中...</div>}>
      <SearchContent />
    </Suspense>
  );
}

interface SearchResult {
  id: string;
  title: string;
  link: string;
  content: string;
  pubDate: string;
  source: string;
  category: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on initial load if query exists
  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      doSearch(initialQ);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    doSearch(trimmed);
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 AI 资讯..."
          className="w-full rounded-xl border px-5 py-4 pr-14 text-base outline-none transition-all"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            color: "white",
            backgroundColor: "var(--accent, #3b82f6)",
          }}
        >
          搜索
        </button>
      </form>

      <div className="mt-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <span className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm" style={{ color: "var(--text-dim)" }}>搜索中...</span>
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              找到 {results.length} 条结果
            </p>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                  没有找到相关资讯
                </p>
                <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                  试试其他关键词
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} query={query} />
                ))}
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔎</div>
            <p style={{ color: "var(--text-dim)" }} className="text-sm">
              输入关键词搜索 AI 相关资讯
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ item, query }: { item: SearchResult; query: string }) {
  const date = new Date(item.pubDate).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });

  function highlight(text: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ color: "var(--accent-text, #60a5fa)", fontWeight: 600 }}>{part}</span>
      ) : (
        part
      )
    );
  }

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-5 card-hover"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: "var(--accent-text, #60a5fa)" }}>
          {item.source}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{date}</span>
      </div>
      <h3 className="font-medium text-base leading-snug" style={{ color: "var(--text-primary)" }}>
        {highlight(item.title)}
      </h3>
      {item.content && (
        <p className="mt-1.5 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {highlight(item.content)}
        </p>
      )}
    </a>
  );
}
