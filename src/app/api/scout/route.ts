import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGETS = [
  "https://www.namus.gov/News",
  "https://reliefweb.int/updates?source=OCHA",
];

const RED_FLAGS = [
  "missing",
  "disappeared",
  "detained",
  "killed",
  "unreported",
  "cover-up",
  "surveillance",
  "contract",
  "emergency",
  "genocide",
  "displaced",
  "asylum",
  "whistleblower",
  "silenced",
  "censored",
  "famine",
  "massacre",
];

async function scrapeTarget(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (SnowdenScout/1.0)",
      },
    });

    const html = await response.text();

    // Extract text blocks between 40-300 chars
    const regex = /[^<>]{40,300}/g;
    const candidates = html.match(regex) || [];

    return candidates.map((c) => c.trim()).filter((c) => c.length >= 40 && c.length <= 300);
  } catch (error) {
    console.error(`[Scout] Scrape error for ${url}:`, error);
    return [];
  }
}

function hasRedFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAGS.some((flag) => lower.includes(flag));
}

async function analyzeCandidate(candidate: string): Promise<{
  title: string;
  summary: string;
} | null> {
  try {
    const prompt = `You are an aggressive investigative journalist. Given this headline or notice, return ONLY a JSON object with no markdown, no backticks, no explanation. JSON shape:
{
  "title": "punchy headline under 12 words",
  "summary": "one sentence explaining why this matters to the public"
}
Only return NOT_NEWSWORTHY (plain text, nothing else) if this is a job listing, sports score, or weather report.
Input: ${candidate}`;

    const message = await groq.messages.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = message.content[0];
    if (raw.type !== "text") return null;

    const text = raw.text.trim();

    if (text === "NOT_NEWSWORTHY") {
      return null;
    }

    try {
      const result = JSON.parse(text);
      return result;
    } catch (parseError) {
      console.error("[Scout] JSON parse failed:", raw);
      return null;
    }
  } catch (error) {
    console.error("[Scout] Analysis error:", error);
    return null;
  }
}

export async function POST() {
  try {
    let scrapedCount = 0;
    let filteredCount = 0;
    let insertedCount = 0;

    for (const targetUrl of TARGETS) {
      const candidates = await scrapeTarget(targetUrl);
      scrapedCount += candidates.length;

      const filtered = candidates.filter((c) => hasRedFlag(c));
      filteredCount += filtered.length;

      for (const candidate of filtered) {
        // 1500ms delay between AI calls
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const result = await analyzeCandidate(candidate);

        if (!result) {
          continue;
        }

        const sourceUrl = targetUrl.split("?")[0]; // Use base target URL
        console.log("[Scout] Attempting insert:", result.title);

        const { error } = await supabase.from("utr_clusters").insert([
          {
            title: result.title,
            summary: result.summary + " Source: " + sourceUrl,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("SUPABASE_ERROR:", error);
          console.error("[Scout] Insert error details:", JSON.stringify(error, null, 2));
        } else {
          console.log("[Scout] Insert success:", result.title);
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      scraped: scrapedCount,
      filtered: filteredCount,
      inserted: insertedCount,
    });
  } catch (error) {
    console.error("[Scout] Route error:", error);
    return NextResponse.json(
      { success: false, error: "Scout operation failed" },
      { status: 500 }
    );
  }
}
