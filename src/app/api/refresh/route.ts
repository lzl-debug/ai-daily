import { NextResponse } from "next/server";

export async function GET() {
  // Hit the news API to refresh cache
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/news`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to refresh" },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      count: Array.isArray(data) ? data.length : 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
