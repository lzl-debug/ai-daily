import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// RSS sources for real-time fetching
const RSS_SOURCES: Record<string, string[]> = {
  "frontend-ai": [
    "https://github.blog/changelog/feed/",
  ],
  "backend-ai": [
    "https://www.anthropic.com/feed.xml",
  ],
  "research": [
    "https://rss.arxiv.org/rss/cs.AI",
  ],
  "tools": [],
  "open-source": [],
  "ai-design": [],
  "industry": [],
};

// Cache for fetched news (persists within same serverless instance)
let cachedNews: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchRSS(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "AI-Daily/1.0" },
    });
    const text = await response.text();
    const items: any[] = [];

    // Simple RSS/Atom parser
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/gi;
    const linkRegex = /<link[^>]*>([^<]+)<\/link>/gi;
    const contentRegex = /<(?:description|content|summary)[^>]*>([^<]*(?:<(?!\/(?:description|content|summary))[^>]*>[^<]*)*)<\/(?:description|content|summary)>/gi;
    const pubDateRegex = /<(?:pubDate|published|updated)[^>]*>([^<]+)<\/(?:pubDate|published|updated)>/gi;

    const titles: string[] = [];
    const links: string[] = [];
    const contents: string[] = [];
    const dates: string[] = [];

    let match;
    while ((match = titleRegex.exec(text)) !== null) {
      if (match[1].trim()) titles.push(match[1].trim());
    }
    while ((match = linkRegex.exec(text)) !== null) {
      const href = match[1].trim();
      if (href && !href.startsWith("<")) links.push(href);
    }
    while ((match = contentRegex.exec(text)) !== null) {
      const c = match[1]?.replace(/<[^>]+>/g, "").trim().slice(0, 300);
      if (c) contents.push(c);
    }
    while ((match = pubDateRegex.exec(text)) !== null) {
      if (match[1].trim()) dates.push(match[1].trim());
    }

    // Some RSS feeds wrap <link> in CDATA or use <link href="..."/>
    const linkHrefRegex = /<link[^>]*href="([^"]+)"[^>]*\/?>/gi;
    while ((match = linkHrefRegex.exec(text)) !== null) {
      if (match[1].trim()) links.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(titles.length, 10); i++) {
      items.push({
        id: `rss-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: titles[i] || "Untitled",
        link: links[i] || "",
        content: contents[i] || "",
        pubDate: dates[i] || new Date().toISOString(),
        source: new URL(url).hostname,
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
    const freshItems: any[] = [];
    const categories = Object.keys(RSS_SOURCES);

    for (const cat of categories) {
      const sources = RSS_SOURCES[cat];
      for (const url of sources) {
        const items = await fetchRSS(url);
        items.forEach((item) => {
          item.category = cat;
          // Deduplicate by title
          const isDuplicate = seedData.some(
            (s) => s.title === item.title || freshItems.some((f) => f.title === item.title)
          );
          if (!isDuplicate && item.title !== "Untitled") {
            freshItems.push(item);
          }
        });
      }
    }

    // Merge: fresh RSS items + seed data, sorted by date
    cachedNews = [...freshItems, ...seedData].sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
    lastFetchTime = now;
  }

  let result = cachedNews;

  if (category) {
    result = result.filter((item) => item.category === category);
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
