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
    let count = 0;
    for (const item of results) {
       const { error } = await supabase.from('utr_clusters').insert({
         title: item.title,
         summary: item.content + " | Source: " + item.url,
         category: "NEWS" 
       });
       if (!error) count++;
    }

    return NextResponse.json({ success: true, inserted: count });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

async function fetchTavily() {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query: "unreported investigative news 2026",
    }),
  });

  const json = await response.json();
  return json.results ?? [];
}