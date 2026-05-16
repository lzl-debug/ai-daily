import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RSS_SOURCES: Record<string, string[]> = {
  "frontend-ai": [
    "https://github.blog/changelog/feed/",
    "https://blog.google/technology/ai/rss/",
  ],
  "backend-ai": [
    "https://www.anthropic.com/feed.xml",
    "https://openai.com/blog/rss.xml",
  ],
  "research": [
    "https://rss.arxiv.org/rss/cs.AI",
  ],
  "tools": [
    "https://www.producthunt.com/feed?category=artificial-intelligence",
  ],
  "ai-tips": [
    "https://simonwillison.net/atom/everything/",
  ],
  "ai-education": [
    "https://www.freecodecamp.org/news/rss/",
  ],
  "open-source": [],
  "ai-design": [],
  "industry": [],
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
    // Fetch RSS with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const freshItems: any[] = [];
    const catEntries = Object.entries(RSS_SOURCES);

    for (const [cat, sources] of catEntries) {
      for (const url of sources) {
        const items = await fetchRSS(url, controller.signal);
        items.forEach((item) => {
          item.category = cat;
          const isDuplicate = seedData.some(
            (s: any) => s.title === item.title
          ) || freshItems.some((f) => f.title === item.title);
          if (!isDuplicate && item.title !== "Untitled") {
            freshItems.push(item);
          }
        });
      }
    }

    clearTimeout(timeout);

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

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
