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
  // Broad Target List: National (Intercept), State (MN Governor), and Local (Mpls)
  const TARGETS = [
    { name: "Mpls Public Notices", url: "https://www.minneapolismn.gov/government/city-council/meetings/" },
    { name: "MN Governor Newsroom", url: "https://mn.gov/governor/newsroom/" },
    { name: "The Intercept - Documents", url: "https://theintercept.com/documents/" },
    { name: "MN Legislature", url: "https://www.revisor.mn.gov/bills/status_search.php?body=House" },
    { name: "ProPublica Nonprofits", url: "https://projects.propublica.org/nonprofits/" },
    { name: "Mpls City Council Votes", url: "https://minneapolis.legistar.com/Legislation.aspx" }
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

Be AGGRESSIVE.If there is ANY hint of public impact, spending, policy change, or government action — even subtle — return the JSON. Only respond NOT_NEWSWORTHY for things like holiday schedules or park events.
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
      title:         result.title,
      summary:       result.summary,
      category:      result.category,
      risk_score:    result.risk_score,
      source_url:    sourceUrl,
      affected_area: "Minneapolis, MN", // Fix 2 applied here
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