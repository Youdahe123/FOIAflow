// src/app/api/scout/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const RED_FLAGS = [
  "surveillance", "ordinance", "contract", "emergency amendment", "zoning",
  "privatization", "no-bid", "sole source", "exemption", "waiver",
  "executive order", "closed session", "personnel matter",
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScoutResult {
  title: string;
  summary: string;
  category: string;
  risk_score: number;
}

async function scrapeNotices(): Promise<{ title: string; text: string; url: string }[]> {
  const { data: html } = await axios.get(
    "https://www.minneapolismn.gov/government/public-notices/",
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; SnowdenScout/1.0)" }, timeout: 10000 }
  );

  const $ = cheerio.load(html);
  const notices: { title: string; text: string; url: string }[] = [];

  // Cast a wide net — grab any anchor or article-like block
  $("a, article, .notice, li").each((_, el) => {
    const title = $(el).text().trim();
    const href  = $(el).attr("href") || "";
    if (title.length > 20 && title.length < 500) {
      notices.push({
        title,
        text: title,
        url: href.startsWith("http") ? href : `https://www.minneapolismn.gov${href}`,
      });
    }
  });

  return notices;
}

function sift(notices: { title: string; text: string; url: string }[]) {
  return notices.filter(({ text }) => {
    const lower = text.toLowerCase();
    return RED_FLAGS.some((flag) => lower.includes(flag));
  });
}

async function analyse(notice: { title: string; text: string; url: string }): Promise<ScoutResult | null> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are an investigative journalist specializing in under-reported local government stories.

Evaluate this public notice and determine if it represents a legitimate "Under-the-Radar" story — something with public impact that mainstream media would likely miss.

Notice:
Title: ${notice.title}
Text: ${notice.text}
Source: ${notice.url}

If this IS a legitimate under-the-radar story, respond ONLY with valid JSON in this exact shape:
{
  "title": "concise news headline",
  "summary": "one punchy sentence explaining why this matters to the public",
  "category": "one of: SURVEILLANCE | LAND_USE | CONTRACTS | EMERGENCY | POLICY | OTHER",
  "risk_score": <integer 1-10 where 10 is most newsworthy>
}

If this is NOT newsworthy (routine notice, event listing, general info), respond with exactly: NOT_NEWSWORTHY`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    if (raw === "NOT_NEWSWORTHY") return null;

    return JSON.parse(raw) as ScoutResult;
  } catch {
    return null;
  }
}

async function publish(result: ScoutResult, sourceUrl: string) {
  const { error } = await supabase.from("utr_clusters").upsert(
    {
      title:       result.title,
      summary:     result.summary,
      category:    result.category,
      risk_score:  result.risk_score,
      source_url:  sourceUrl,
      jurisdiction: "Minneapolis, MN",
      trend_score: "emerging",
      discovered_at: new Date().toISOString(),
    },
    { onConflict: "title" }
  );
  if (error) throw error;
}

export async function GET() {
  try {
    console.log("[Scout] Starting harvest...");

    const notices  = await scrapeNotices();
    console.log(`[Scout] Raw notices found: ${notices.length}`);

    const flagged  = sift(notices);
    console.log(`[Scout] Red-flag hits: ${flagged.length}`);

    let scoops = 0;
    const results: ScoutResult[] = [];

    for (const notice of flagged) {
      await delay(2000);
      const result = await analyse(notice);
      if (!result) continue;

      try {
        await publish(result, notice.url);
        results.push(result);
        scoops++;
        console.log(`[Scout] Scoop published: ${result.title} (risk: ${result.risk_score})`);
      } catch (err) {
        console.error(`[Scout] Publish failed for "${result.title}":`, err);
      }
    }

    return NextResponse.json({
      success:        true,
      notices_scraped: notices.length,
      red_flag_hits:  flagged.length,
      scoops_found:   scoops,
      results,
    });
  } catch (err) {
    console.error("[Scout] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}