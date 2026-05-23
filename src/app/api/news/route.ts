import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RSS_SOURCES: Record<string, string[]> = {
  "frontend-ai": [
    "https://github.blog/changelog/feed/",
    "https://blog.google/technology/ai/rss/",
    "https://code.visualstudio.com/feed.xml",
    "https://devblogs.microsoft.com/typescript/feed/",
  ],
  "backend-ai": [
    "https://www.anthropic.com/feed.xml",
    "https://openai.com/blog/rss.xml",
    "https://blog.google/technology/ai/rss/",
    "https://aws.amazon.com/blogs/machine-learning/feed/",
  ],
  "research": [
    "https://rss.arxiv.org/rss/cs.AI",
    "https://rss.arxiv.org/rss/cs.CL",
    "https://rss.arxiv.org/rss/cs.LG",
    "https://deepmind.google/blog/rss.xml",
  ],
  "tools": [
    "https://www.producthunt.com/feed?category=artificial-intelligence",
    "https://alternativeto.net/news/feed/",
  ],
  "ai-tips": [
    "https://simonwillison.net/atom/everything/",
    "https://lilianweng.github.io/index.xml",
    "https://www.latent.space/feed",
  ],
  "ai-education": [
    "https://www.freecodecamp.org/news/rss/",
    "https://machinelearningmastery.com/feed/",
    "https://towardsdatascience.com/feed",
  ],
  "ai-influencers": [
    "https://karpathy.ai/feed.xml",
    "https://simonwillison.net/atom/everything/",
    "https://lmsys.org/blog/feed.xml",
  ],
  "ai-video": [
    "https://runwayml.com/feed.xml",
    "https://stability.ai/blog?format=rss",
    "https://openai.com/blog/rss.xml",
  ],
  "ai-ecosystem": [
    "https://github.blog/changelog/feed/",
    "https://www.anthropic.com/feed.xml",
  ],
  "open-source": [
    "https://github.blog/feed/",
    "https://huggingface.co/blog/feed.xml",
    "https://ollama.com/blog/feed",
  ],
  "open-source-top": [
    "https://github.blog/feed/",
    "https://huggingface.co/blog/feed.xml",
  ],
  "ai-design": [
    "https://stability.ai/blog?format=rss",
    "https://openai.com/blog/rss.xml",
  ],
  "industry": [
    "https://techcrunch.com/category/artificial-intelligence/feed/",
    "https://venturebeat.com/category/ai/feed/",
    "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    "https://www.wired.com/feed/tag/ai/latest/rss",
  ],
};

let cachedNews: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchRSS(url: string, signal: AbortSignal): Promise<any[]> {
  try {
    const response = await fetch(url, {
      signal,
      headers: { "User-Agent": "AI-Daily/1.0 (RSS Reader)" },
    });
    const text = await response.text();

    const titles: string[] = [];
    const links: string[] = [];
    const contents: string[] = [];
    const dates: string[] = [];

    // Parse <entry> (Atom) or <item> (RSS 2.0)
    const entryRegex = /<(entry|item)>([\s\S]*?)<\/(entry|item)>/gi;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(text)) !== null) {
      const block = entryMatch[2];

      const t = block.match(/<title[^>]*>([^<]*)<\/title>/);
      if (t) titles.push(t[1].trim());

      const l =
        block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/) ||
        block.match(/<link[^>]*>([^<]+)<\/link>/);
      if (l) links.push((l[1] || l[2] || "").trim());

      const c =
        block.match(/<(?:description|content|summary)[^>]*>([\s\S]*?)<\/(?:description|content|summary)>/);
      if (c) contents.push(c[1].replace(/<[^>]+>/g, "").trim().slice(0, 300));

      const d =
        block.match(/<(?:pubDate|published|updated)[^>]*>([^<]+)<\/(?:pubDate|published|updated)>/);
      if (d) dates.push(d[1].trim());
    }

    const items: any[] = [];
    for (let i = 0; i < Math.min(titles.length, 10); i++) {
      items.push({
        id: `rss-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: titles[i] || "Untitled",
        link: links[i] || "",
        content: contents[i] || "",
        pubDate: dates[i] || new Date().toISOString(),
        source: new URL(url).hostname.replace("www.", ""),
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const searchQuery = searchParams.get("q");

  // Load seed data from news.json
  const newsPath = path.join(process.cwd(), "data", "news.json");
  let seedData: any[] = [];
  try {
    seedData = JSON.parse(fs.readFileSync(newsPath, "utf-8"));
  } catch {
    seedData = [];
  }

  // Fetch fresh RSS data if cache expired
  const now = Date.now();
  if (!cachedNews || now - lastFetchTime > CACHE_TTL) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchTasks: Promise<{ cat: string; items: any[] }>[] = [];
    for (const [cat, sources] of Object.entries(RSS_SOURCES)) {
      for (const url of sources) {
        fetchTasks.push(
          fetchRSS(url, controller.signal).then((items) => ({ cat, items }))
        );
      }
    }

    const results = await Promise.allSettled(fetchTasks);
    clearTimeout(timeout);

    const freshItems: any[] = [];
    const seenTitles = new Set(seedData.map((s: any) => s.title));

    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const { cat, items } = r.value;
      for (const item of items) {
        item.category = cat;
        if (!seenTitles.has(item.title) && item.title !== "Untitled") {
          seenTitles.add(item.title);
          freshItems.push(item);
        }
      }
    }

    cachedNews = [...freshItems, ...seedData].sort(
      (a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
    );
    lastFetchTime = now;
  }

  let result = cachedNews;

  if (category) {
    result = result.filter((item) => item.category === category);
  }

  // If no results for a category, return all seed data for that category as fallback
  if (result.length === 0 && category) {
    result = seedData.filter((item) => item.category === category);
  }

  // Search filter with token-level matching and relevance ranking
  if (searchQuery) {
    // Split query into tokens: separate CJK characters from alphanumeric sequences
    // This ensures "codex教程" is tokenized as ["codex", "教", "程"] instead of one token
    const tokens = searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .flatMap((s) => {
        const parts: string[] = [];
        let buf = "";
        for (const ch of s) {
          if (/[a-z0-9.@#+]/.test(ch)) {
            buf += ch;
          } else {
            if (buf) { parts.push(buf); buf = ""; }
            if (/[一-鿿]/.test(ch)) parts.push(ch);
          }
        }
        if (buf) parts.push(buf);
        return parts;
      })
      .filter((t) => t.length > 0);

    if (tokens.length > 0) {
      result = result.filter((item) => {
        const text = [item.title, item.content, item.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return tokens.some((token) => text.includes(token));
      });

      // Sort by relevance: more token matches + title matches ranked higher
      result.sort((a: any, b: any) => {
        const aText = [a.title, a.content, a.source].filter(Boolean).join(" ").toLowerCase();
        const bText = [b.title, b.content, b.source].filter(Boolean).join(" ").toLowerCase();
        const aScore = tokens.filter((t) => aText.includes(t)).length;
        const bScore = tokens.filter((t) => bText.includes(t)).length;
        const aTitleBonus = tokens.filter((t) => (a.title || "").toLowerCase().includes(t)).length * 3;
        const bTitleBonus = tokens.filter((t) => (b.title || "").toLowerCase().includes(t)).length * 3;
        return bScore + bTitleBonus - (aScore + aTitleBonus);
      });
    }
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
