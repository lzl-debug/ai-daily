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

  async function fetchFromHN(): Promise<any[]> {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=12`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.hits || []).map((hit: any) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title || "Untitled",
        link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        content: hit.story_text
          ? hit.story_text.replace(/<[^>]+>/g, "").slice(0, 200)
          : `${hit.points || 0} points · ${hit.num_comments || 0} comments`,
        pubDate: new Date(hit.created_at || Date.now()).toISOString(),
        source: "Hacker News",
        category: "web",
        score: hit.points || 0,
      }));
    } catch {
      return [];
    }
  }

  async function fetchFromReddit(): Promise<any[]> {
    try {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(q + " AI")}&sort=relevance&t=month&limit=12`,
        {
          signal: AbortSignal.timeout(5000),
          headers: { "User-Agent": "AI-Daily/1.0" },
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const posts = data?.data?.children || [];
      return posts.map((child: any) => {
        const p = child.data;
        return {
          id: `reddit-${p.id}`,
          title: p.title || "Untitled",
          link: p.url?.startsWith("http") ? p.url : `https://reddit.com${p.permalink}`,
          content: (p.selftext || "").slice(0, 200) || `r/${p.subreddit} · ${p.score} upvotes`,
          pubDate: new Date((p.created_utc || 0) * 1000).toISOString(),
          source: `Reddit r/${p.subreddit}`,
          category: "web",
          score: p.score || 0,
        };
      });
    } catch {
      return [];
    }
  }

  async function fetchFromDevTo(): Promise<any[]> {
    try {
      const res = await fetch(
        `https://dev.to/api/articles?per_page=10&tag=ai&search=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return [];
      const articles = await res.json();
      return (articles || []).map((a: any) => ({
        id: `devto-${a.id}`,
        title: a.title || "Untitled",
        link: a.url || "",
        content: (a.description || "").slice(0, 200),
        pubDate: new Date(a.published_at || Date.now()).toISOString(),
        source: "DEV.to",
        category: "tutorial",
        score: a.public_reactions_count || 0,
      }));
    } catch {
      return [];
    }
  }

  async function fetchFromGitHub(): Promise<any[]> {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}+topic:ai&sort=stars&order=desc&per_page=8`,
        {
          signal: AbortSignal.timeout(5000),
          headers: { Accept: "application/vnd.github.v3+json" },
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((repo: any) => ({
        id: `gh-${repo.id}`,
        title: `${repo.full_name} - ${repo.description || ""}`.slice(0, 120),
        link: repo.html_url,
        content: `⭐ ${repo.stargazers_count.toLocaleString()} stars · ${repo.language || "Multi"} · updated ${repo.updated_at?.split("T")[0]}`,
        pubDate: new Date(repo.pushed_at || repo.updated_at || Date.now()).toISOString(),
        source: "GitHub",
        category: "open-source",
        score: repo.stargazers_count || 0,
      }));
    } catch {
      return [];
    }
  }

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

      if (tokens.length === 0) return [];

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

      return results.slice(0, 8).map((item: any) => ({
        ...item,
        score: 0,
        category: item.category || "local",
      }));
    } catch {
      return [];
    }
  }

  const [hnResults, redditResults, devtoResults, githubResults, localResults] = await Promise.all([
    fetchFromHN(),
    fetchFromReddit(),
    fetchFromDevTo(),
    fetchFromGitHub(),
    fetchFromLocal(),
  ]);

  const allResults = [...hnResults, ...redditResults, ...devtoResults, ...githubResults, ...localResults];

  // Deduplicate by normalized link
  const seen = new Set<string>();
  const uniqueResults = allResults.filter((item) => {
    const key = item.link.toLowerCase().replace(/\/$/, "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by freshness + popularity
  uniqueResults.sort((a, b) => {
    const now = Date.now();
    const aAge = (now - new Date(a.pubDate).getTime()) / (1000 * 60 * 60 * 24);
    const bAge = (now - new Date(b.pubDate).getTime()) / (1000 * 60 * 60 * 24);
    const aFresh = Math.max(0, 1 - aAge / 30);
    const bFresh = Math.max(0, 1 - bAge / 30);
    const aPopular = Math.min(1, Math.log10((a.score || 0) + 1) / 4);
    const bPopular = Math.min(1, Math.log10((b.score || 0) + 1) / 4);
    const aRank = aFresh * 0.6 + aPopular * 0.4;
    const bRank = bFresh * 0.6 + bPopular * 0.4;
    return bRank - aRank;
  });

  const sources: string[] = [];
  if (hnResults.length > 0) sources.push("HN");
  if (redditResults.length > 0) sources.push("Reddit");
  if (devtoResults.length > 0) sources.push("DEV.to");
  if (githubResults.length > 0) sources.push("GitHub");
  if (localResults.length > 0) sources.push("AI Daily");

  return NextResponse.json({
    results: uniqueResults.slice(0, 30),
    source: sources.join("+") || "local",
    total: uniqueResults.length,
  });
}
