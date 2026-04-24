// src/app/api/scout/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const RED_FLAGS = [
  "missing", "disappeared", "silenced", "detained", "killed",
  "genocide", "massacre", "ethnic cleansing", "war crime",
  "suppressed", "censored", "whistleblower", "retaliation",
  "unreported", "cover-up", "classified", "redacted",
  "scientist", "researcher", "journalist", "activist",
  "famine", "displacement", "refugee", "asylum",
  "surveillance", "contract", "emergency", "no-bid",
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
  const TARGETS = [
    { name: "Missing & Endangered Persons - NamUs", url: "https://www.namus.gov/News" },
    { name: "UN OCHA Humanitarian Alerts", url: "https://reliefweb.int/updates?source=OCHA" },
    { name: "Committee to Protect Journalists", url: "https://cpj.org/news/" },
    { name: "Genocide Watch", url: "https://www.genocidewatch.com/alerts" },
    { name: "ACLU Press Releases", url: "https://www.aclu.org/press-releases" },
    { name: "EFF Deeplinks", url: "https://www.eff.org/deeplinks" },
    { name: "Missing Scientists - Science Integrity Digest", url: "https://scienceintegritydigest.com" },
    { name: "The Intercept", url: "https://theintercept.com/news/" },
    { name: "ProPublica Investigations", url: "https://www.propublica.org/investigations" },
    { name: "Global Voices", url: "https://globalvoices.org/world/" },
    { name: "Human Rights Watch", url: "https://www.hrw.org/news" },
    { name: "MN Reformer", url: "https://minnesotareformer.com/briefs/" },
  ];

  const allNotices: { title: string; text: string; url: string }[] = [];

  for (const target of TARGETS) {
    try {
      console.log(`[Scout] Harvesting from: ${target.name}`);
      const { data: html } = await axios.get(target.url, { 
        headers: { "User-Agent": "Mozilla/5.0 (SnowdenScout/1.0)" }, 
        timeout: 10000 
      });

      const $ = cheerio.load(html);

      // This logic grabs headlines and links across different site layouts
      $("a, h2, h3").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href") || "";
        
        // Filter for potential headlines (not too short, not too long)
        if (title.length > 25 && title.length < 300) {
          allNotices.push({
            title,
            text: title,
            url: href.startsWith("http") ? href : `${new URL(target.url).origin}${href}`,
          });
        }
      });
      
      // Wait 1 second between sites to avoid getting blocked
      await delay(1000); 
    } catch (err: any) {
      console.error(`[Scout] Failed to harvest ${target.name}:`, err.message);
    }
  }

  return allNotices;
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
