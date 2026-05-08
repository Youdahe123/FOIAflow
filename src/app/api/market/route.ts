import { NextResponse } from "next/server";

interface CacheEntry {
  data: MarketResponse;
  fetchedAt: number;
}

interface MarketResponse {
  price: string;
  change: string;
  changePercent: string;
  positive: boolean;
  points: { time: string; price: number }[];
  status: "ok" | "closed" | "after_hours" | "unavailable";
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=5m&range=1d",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) throw new Error(`Yahoo Finance responded ${res.status}`);

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      const response: MarketResponse = {
        price: "—",
        change: "Unavailable",
        changePercent: "Try again later",
        positive: true,
        points: [],
        status: "unavailable",
      };
      return NextResponse.json(response);
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points = timestamps
      .map((ts, i) => ({
        time: new Date(ts * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/New_York",
        }),
        price: closes[i] ?? null,
      }))
      .filter((p): p is { time: string; price: number } => p.price !== null)
      .slice(-30);

    const latest = meta.regularMarketPrice ?? points[points.length - 1]?.price ?? 0;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? latest;
    const change = latest - prev;
    const changePct = prev !== 0 ? (change / prev) * 100 : 0;
    const positive = change >= 0;

    const response: MarketResponse = {
      price: latest.toFixed(2),
      change: (positive ? "+" : "") + change.toFixed(2),
      changePercent: (positive ? "+" : "") + changePct.toFixed(2) + "%",
      positive,
      points,
      status: "ok",
    };

    cache = { data: response, fetchedAt: Date.now() };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[MARKET] fetch error:", err);
    const response: MarketResponse = {
      price: "—",
      change: "Unavailable",
      changePercent: "Try again later",
      positive: true,
      points: [],
      status: "unavailable",
    };
    return NextResponse.json(response);
  }
}
