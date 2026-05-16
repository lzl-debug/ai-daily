export interface NewsItem {
  id: string;
  title: string;
  link: string;
  content: string;
  pubDate: string;
  source: string;
  category: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  sources: string[];
}

import categoriesData from "../../data/categories.json";
import newsData from "../../data/news.json";

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getNews(): NewsItem[] {
  return newsData as NewsItem[];
}

export function getNewsByCategory(categoryId: string): NewsItem[] {
  return (newsData as NewsItem[]).filter((item) => item.category === categoryId);
}

export function getLatestNews(limit = 20): NewsItem[] {
  return (newsData as NewsItem[])
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, limit);
}
