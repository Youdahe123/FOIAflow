import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const QUERIES = [
  "underreported local government corruption 2026",
  "investigative journalism exclusive 2026 unreported",
  "humanitarian crisis ignored mainstream media 2026",
  "whistleblower government cover-up 2026",
  "missing persons cold case breakthrough 2026",
  "local police misconduct unreported 2026",
  "corporate fraud environmental cover-up 2026",
];

async function tavilySearch(query: string) {
  console.log("[TAVILY] Searching:", query);
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 5,
      exclude_domains: [
        "namus.gov", "youtube.com", "reddit.com",
        "twitter.com", "facebook.com", "wikipedia.org"
      ],
      include_domains: [
        "propublica.org", "theintercept.com", "theguardian.com",
        "apnews.com", "reuters.com", "npr.org", "politico.com",
        "nytimes.com", "washingtonpost.com", "bloomberg.com",
        "marshall project.org", "texastribune.org", "stateline.org",
        "missouriindependent.com", "nevadacurrent.com", "spotlightpa.org"
      ]
    }),
  });

  if (!res.ok) {
    console.error("[TAVILY] HTTP error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  console.log("[TAVILY] Results count:", data.results?.length ?? 0);
  return data.results ?? [];
}

function assignCategory(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  if (text.match(/missing|unidentified|abducted|disappeared|namus/)) return "MISSING";
  if (text.match(/humanitarian|crisis|displaced|refugee|famine|genocide/)) return "HUMANITARIAN";
  if (text.match(/surveillance|tracking|facial recognition|data collection/)) return "SURVEILLANCE";
  if (text.match(/corruption|cover-up|whistleblower|misconduct|fraud|cover up/)) return "POLICY";
  if (text.match(/environment|pollution|chemical|toxic|climate/)) return "ENVIRONMENT";
  return "INVESTIGATIVE";
}

export async function GET() {
  console.log("[SCOUT] Starting Tavily global search...");
  console.log("[SCOUT] TAVILY KEY:", process.env.TAVILY_API_KEY ? "LOADED ✓" : "MISSING ✗");

  const seen = new Set<string>();
  let inserted = 0;
  let skipped = 0;
  let totalFound = 0;

  try {
    for (const query of QUERIES) {
      const results = await tavilySearch(query);
      totalFound += results.length;

      for (const result of results) {
        if (!result.title || !result.url || !result.content) { skipped++; continue; }
        if (seen.has(result.url)) { skipped++; continue; }
        if (result.content.length < 50) { skipped++; continue; }
        seen.add(result.url);

        const article = {
          title: result.title.slice(0, 255),
          summary: result.content.slice(0, 400) + " | Source: " + result.url,
          category: assignCategory(result.title, result.content),
          source_url: result.url,
        };

        console.log("[INSERT_ATTEMPT]", article.title);
        const { data, error } = await supabase
          .from("utr_clusters")
          .insert(article);

        console.log("SUPABASE_DATA:", JSON.stringify(data));
        console.log("FULL_ERROR_OBJECT:", JSON.stringify(error));

        if (!error) {
          inserted++;
          console.log("[INSERT_SUCCESS]", article.title);
        } else {
          skipped++;
        }

        await new Promise(r => setTimeout(r, 200));
      }
    }

    return NextResponse.json({
      success: true,
      total_found: totalFound,
      inserted,
      skipped,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[SCOUT_FATAL]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
