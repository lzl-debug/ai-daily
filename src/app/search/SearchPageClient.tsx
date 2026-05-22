"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  score?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchSource, setSearchSource] = useState("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSearchSource(data.source || "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

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

  const sourceLabels: Record<string, string> = {
    "Hacker News": "HN",
    "GitHub": "GitHub",
    "DEV.to": "DEV",
  };

  function getSourceColor(source: string) {
    if (source.startsWith("Reddit")) return "#ff4500";
    if (source === "Hacker News") return "#ff6600";
    if (source === "DEV.to") return "#08090a";
    if (source === "GitHub") return "#6e40c9";
    return "var(--accent-text, #60a5fa)";
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 AI 新闻、工具、教程、开源项目..."
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
            <span className="ml-3 text-sm" style={{ color: "var(--text-dim)" }}>正在搜索多个来源...</span>
          </div>
        )}

        {!loading && searched && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                找到 {results.length} 条结果
              </p>
              {searchSource && (
                <div className="flex items-center gap-1.5">
                  {searchSource.split("+").map((s) => (
                    <span
                      key={s}
                      className="text-[10px] rounded-full px-2 py-0.5"
                      style={{ color: "var(--text-dim)", backgroundColor: "var(--badge-bg)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
                  没有找到相关结果
                </p>
                <p className="text-sm mt-2" style={{ color: "var(--text-dim)" }}>
                  试试其他关键词，如 "GPT-5"、"AI工具"、"LLM教程"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <ResultCard key={item.id} item={item} query={query} getSourceColor={getSourceColor} />
                ))}
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔎</div>
            <p style={{ color: "var(--text-dim)" }} className="text-sm">
              搜索 AI 新闻、教程、工具和开源项目
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["GPT-5", "AI Agent", "Claude", "Stable Diffusion", "LLM教程"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); doSearch(tag); router.push(`/search?q=${encodeURIComponent(tag)}`); }}
                  className="text-xs rounded-full px-3 py-1.5 transition-all hover:scale-105"
                  style={{ backgroundColor: "var(--badge-bg)", color: "var(--text-secondary)" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ item, query, getSourceColor }: { item: SearchResult; query: string; getSourceColor: (s: string) => string }) {
  const date = new Date(item.pubDate).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });

  function highlight(text: string) {
    if (!query.trim()) return text;
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const parts = text.split(new RegExp(`(${escaped})`, "gi"));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} style={{ color: "var(--accent-text, #60a5fa)", fontWeight: 600 }}>{part}</span>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
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
        <span
          className="text-[11px] font-medium rounded px-1.5 py-0.5"
          style={{ color: getSourceColor(item.source), backgroundColor: "var(--badge-bg)" }}
        >
          {item.source}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{date}</span>
        {item.score && item.score > 0 && (
          <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
            {item.score > 1000 ? `${(item.score / 1000).toFixed(1)}k` : item.score} {item.source === "GitHub" ? "⭐" : "↑"}
          </span>
        )}
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
