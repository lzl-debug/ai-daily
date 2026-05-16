import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [], source: "local" });
  }

  const q = query.trim();

  // Fetch from Hacker News Algolia API (free, no API key needed)
  async function fetchFromHN(): Promise<any[]> {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=15`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`HN API returned ${res.status}`);
      const data = await res.json();
      return (data.hits || []).map((hit: any) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title || "Untitled",
        link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        content: (hit.points ? `${hit.points} 点 · ${hit.author || "匿名"}` : hit.story_text || "") || "",
        pubDate: new Date(hit.created_at || Date.now()).toISOString(),
        source: "Hacker News",
        category: "web",
      }));
    } catch {
      return [];
    }
  }

  // Fallback: search local news data
  async function fetchFromLocal(): Promise<any[]> {
    try {
      const newsPath = path.join(process.cwd(), "data", "news.json");
      const allNews = JSON.parse(fs.readFileSync(newsPath, "utf-8"));
      const tokens = q.toLowerCase().split(/\s+/).flatMap((s) => {
        const parts: string[] = [];
        let buf = "";
        for (const ch of s) {
          if (/[a-z0-9.@#+]/.test(ch)) buf += ch;
          else {
            if (buf) { parts.push(buf); buf = ""; }
            if (/[一-鿿]/.test(ch)) parts.push(ch);
          }
        }
        if (buf) parts.push(buf);
        return parts;
      }).filter(Boolean);

      let results = allNews.filter((item: any) => {
        const text = [item.title, item.content, item.source].filter(Boolean).join(" ").toLowerCase();
        return tokens.some((t: string) => text.includes(t));
      });

      results.sort((a: any, b: any) => {
        const aText = [a.title, a.content, a.source].filter(Boolean).join(" ").toLowerCase();
        const bText = [b.title, b.content, b.source].filter(Boolean).join(" ").toLowerCase();
        const aScore = tokens.filter((t: string) => aText.includes(t)).length;
        const bScore = tokens.filter((t: string) => bText.includes(t)).length;
        const aTitleBonus = tokens.filter((t: string) => (a.title || "").toLowerCase().includes(t)).length * 3;
        const bTitleBonus = tokens.filter((t: string) => (b.title || "").toLowerCase().includes(t)).length * 3;
        return bScore + bTitleBonus - (aScore + aTitleBonus);
      });

      return results.slice(0, 10).map((item: any) => ({
        ...item,
        category: item.category || "local",
      }));
    } catch {
      return [];
    }
  }

  // Fetch from multiple sources in parallel
  const [hnResults, localResults] = await Promise.all([
    fetchFromHN(),
    fetchFromLocal(),
  ]);

  const allResults = [...hnResults, ...localResults];

  // Remove duplicates by link
  const seen = new Set<string>();
  const uniqueResults = allResults.filter((item) => {
    const key = item.link.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    results: uniqueResults.slice(0, 25),
    source: hnResults.length > 0 ? "hn+local" : "local",
    total: uniqueResults.length,
  });
}
