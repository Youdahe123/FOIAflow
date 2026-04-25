import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  "unidentified",
];

async function scrapeTarget(url: string): Promise<Array<{ text: string; sourceUrl: string }>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (SnowdenScout/1.0)",
      },
    });

    const html = await response.text();

    // Extract text blocks between HTML tags (40-300 chars)
    const matches = html.match(/>[^<]{40,300}</g) || [];

    const candidates = matches.map((match) => {
      const cleaned = match.replace(/^>|<$/g, "").trim();
      return {
        text: cleaned,
        sourceUrl: url,
      };
    });

    return candidates;
  } catch (error) {
    console.error(`[SCRAPE_ERROR] ${url}:`, error);
    return [];
  }
}

function hasRedFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAGS.some((flag) => lower.includes(flag));
}

async function analyseCandidate(
  text: string,
  sourceUrl: string
): Promise<{ title: string; category: string; summary: string } | null> {
  try {
    const prompt = `Return ONLY a raw JSON object, no markdown, no backticks, no explanation.
Schema: { "title": "headline under 10 words", "category": "one of: MISSING|HUMANITARIAN|SURVEILLANCE|POLICY|ENVIRONMENT|OTHER" }
If this is a job listing, sports result, or navigation menu item return only the text: SKIP
Input: ${text}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 256,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ANALYSE_ERROR] API response not ok:", data);
      return null;
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("[ANALYSE_ERROR] No content in response");
      return null;
    }

    if (content === "SKIP") {
      return null;
    }

    const parsed = JSON.parse(content);
    return {
      title: parsed.title ?? "Untitled",
      category: parsed.category ?? "UNRESOLVED",
      summary: text.slice(0, 200) + " | Source: " + sourceUrl,
    };
  } catch (err) {
    console.error("[ANALYSE_ERROR]", err);
    return null;
  }
}

async function insertCluster(record: { title: string; summary: string; category: string }) {
  console.log("[INSERT_ATTEMPT]", record.title);

  const { data, error } = await supabase.from("utr_clusters").insert({
    title: record.title,
    summary: record.summary,
    category: record.category ?? "UNRESOLVED",
  });

  console.log("SUPABASE_DATA:", JSON.stringify(data, null, 2));
  console.log("FULL_ERROR_OBJECT:", JSON.stringify(error, null, 2));

  if (error === null) {
    console.log("[INSERT_SUCCESS]", record.title);
  }

  return { data, error };
}

export async function GET() {
  try {
    console.log("[SCOUT] GROQ KEY LOADED:", process.env.GROQ_API_KEY ? "YES" : "MISSING");

    let scrapedCount = 0;
    let filteredCount = 0;
    let insertedCount = 0;

    for (const targetUrl of TARGETS) {
      const candidates = await scrapeTarget(targetUrl);
      scrapedCount += candidates.length;

      const filtered = candidates.filter((c) => hasRedFlag(c.text));
      filteredCount += filtered.length;

      for (const candidate of filtered) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const analysisResult = await analyseCandidate(candidate.text, candidate.sourceUrl);

        if (!analysisResult) {
          continue;
        }

        const insertResult = await insertCluster({
          title: analysisResult.title,
          summary: analysisResult.summary,
          category: analysisResult.category,
        });

        if (insertResult.error === null) {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      scraped: scrapedCount,
      filtered: filteredCount,
      inserted: insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[FATAL_ERROR]", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
