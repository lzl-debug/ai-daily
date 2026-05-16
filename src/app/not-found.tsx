import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-6xl mb-6">🤖</div>
      <h1 className="text-2xl font-bold text-[var(--text-secondary)] mb-3">页面未找到</h1>
      <p className="text-[var(--text-tertiary)] mb-8 max-w-md">
        这个页面可能在宇宙的另一个平行维度里，但在这里它不存在。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all"
        style={{
          color: "var(--text-secondary)",
          backgroundColor: "var(--hover-bg-strong)",
        }}
      >
        ← 返回首页
      </Link>
    </div>
  );
}
