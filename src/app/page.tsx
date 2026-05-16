import Link from "next/link";
import { getCategories, getLatestNews } from "@/lib/data";
import type { Category } from "@/lib/data";
import LiveNewsFeed from "@/components/LiveNewsFeed";

export default function HomePage() {
  const categories = getCategories();
  const latestNews = getLatestNews(12);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="gradient-text">AI 资讯</span>
          <br />
          <span className="text-white/90">每日速览</span>
        </h1>
        <p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
          每日聚合 AI 领域前沿资讯 — 从前端工具到后端框架，从学术研究到开源项目
        </p>
      </section>

      {/* Category Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-white/80">分类浏览</h2>
          <span className="text-xs text-white/30">{categories.length} 个分类</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat: Category, i: number) => (
            <Link
              key={cat.id}
              href={`/${cat.id}`}
              className="group glass rounded-xl p-5 card-hover"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color} text-lg`}>
                {cat.icon}
              </div>
              <h3 className="mt-4 font-semibold text-white/90 group-hover:text-white transition-colors">
                {cat.name}
              </h3>
              <p className="mt-1.5 text-xs text-white/40">
                {cat.nameEn}
              </p>
              <p className="mt-2 text-sm text-white/50 leading-relaxed line-clamp-2">
                {cat.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                浏览资讯
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest News - Live */}
      <section>
        <LiveNewsFeed initialNews={latestNews} categories={categories} />
      </section>
    </div>
  );
}
