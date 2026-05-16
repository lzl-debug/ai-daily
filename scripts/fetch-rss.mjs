import Parser from "rss-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parser = new Parser();

const categoriesPath = path.join(__dirname, "..", "data", "categories.json");
const newsPath = path.join(__dirname, "..", "data", "news.json");

const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));

async function fetchAll() {
  const allNews = [];
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const cat of categories) {
    if (!cat.sources || cat.sources.length === 0) continue;
    console.log(`Fetching [${cat.name}] from ${cat.sources.length} sources...`);

    for (const feedUrl of cat.sources) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const items = feed.items.slice(0, 8).map((item) => ({
          id: `${cat.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: item.title || "Untitled",
          link: item.link || "",
          content: item.contentSnippet?.slice(0, 300) || item.content?.slice(0, 300) || "",
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feed.title || feedUrl,
          category: cat.id,
          date: today,
        }));
        allNews.push(...items);
        console.log(`  ✓ ${feedUrl} — ${items.length} items`);
      } catch (err) {
        console.error(`  ✗ ${feedUrl} — ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }
  }

  // Save today's news
  const existing = fs.existsSync(newsPath)
    ? JSON.parse(fs.readFileSync(newsPath, "utf-8"))
    : [];

  // Keep only last 7 days, merge with today
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = existing.filter(
    (item: any) => new Date(item.date || item.pubDate) > cutoff
  );

  const merged = [...allNews, ...recent];
  fs.writeFileSync(newsPath, JSON.stringify(merged, null, 2), "utf-8");

  console.log(`\nDone! Total: ${merged.length} items (${allNews.length} new today)`);
}

fetchAll().catch(console.error);
