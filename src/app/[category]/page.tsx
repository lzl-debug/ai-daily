import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getNewsByCategory } from "@/lib/data";
import type { Category } from "@/lib/data";
import LiveCategoryFeed from "@/components/LiveCategoryFeed";

export function generateStaticParams() {
  return getCategories().map((cat: Category) => ({ category: cat.id }));
}

export function generateMetadata({ params }: { params: { category: string } }) {
  const cat = getCategories().find((c: Category) => c.id === params.category);
  if (!cat) return { title: "Not Found" };
  return {
    title: `${cat.name} - AI Daily`,
    description: cat.description,
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const cat = getCategories().find((c: Category) => c.id === params.category);
  if (!cat) notFound();

  const news = getNewsByCategory(cat.id);
  const categories = getCategories();

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="text-sm text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
      >
        ← 返回
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl`}>
          {cat.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white/90">{cat.name}</h1>
          <p className="text-sm text-white/40 mt-1">{cat.description}</p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 pb-6 border-b border-white/5">
        {categories.map((c: Category) => (
          <Link
            key={c.id}
            href={`/${c.id}`}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              c.id === cat.id
                ? `bg-gradient-to-r ${c.color} text-white`
                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
            }`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      {/* News List - Live */}
      <LiveCategoryFeed initialNews={news} categoryId={cat.id} />
    </div>
  );
}
