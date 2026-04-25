import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch from Tavily
    const results = await fetchTavily();

    // 2. Insert into Supabase
    const seenUrls = new Set<string>();
    let count = 0;

    for (const item of results) {
      if (!item.url || seenUrls.has(item.url)) {
        continue;
      }
      seenUrls.add(item.url);

      const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();
      const category = text.includes("missing") || text.includes("namus")
        ? "MISSING"
        : text.includes("crisis") || text.includes("displaced")
        ? "HUMANITARIAN"
        : "INVESTIGATIVE";

      const { data, error } = await supabase.from('utr_clusters').insert({
        title: item.title,
        summary: item.content,
        category,
      });

      console.log("SUPABASE_DATA:", data);
      console.log("FULL_ERROR_OBJECT:", error);

      if (error) {
        console.error("[SUPABASE_ERROR]", error);
      } else {
        console.log("[INSERT_SUCCESS]", item.title);
        count++;
      }
    }

    return NextResponse.json({ success: true, inserted: count });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function fetchTavily() {
  const queries = [
    "unreported local investigative news 2026",
    "humanitarian crisis alerts under-reported 2026",
    "unidentified persons cases namus 2026",
  ];

  const results: Array<{ title: string; content: string; url: string }> = [];

  for (const query of queries) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    if (Array.isArray(json.results)) {
      results.push(...json.results);
    }
  }

  return results;
}