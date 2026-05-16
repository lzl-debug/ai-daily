import { MetadataRoute } from "next";
import { getCategories } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL
    ? `https://${process.env.SITE_URL}`
    : "https://ai-daily-lac-iota.vercel.app";
  const categories = getCategories();

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...categoryUrls,
    {
      url: `${baseUrl}/api/news`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.3,
    },
  ];
}
