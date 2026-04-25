// src/app/api/scout/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
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

interface ScoutResult {
  title: string;
  summary: string;
  category: string;
  risk_score: number;
}

async function publish(result: ScoutResult, sourceUrl: string) {
  const { error } = await supabase.from("utr_clusters").upsert(
    {
      title:       result.title,
      summary:     result.summary,
      category:    result.category,
      risk_score:  result.risk_score,
      source_url:  sourceUrl,
      affected_area: "Global",
      discovered_at: new Date().toISOString(),
    },
    { onConflict: "title" }
  );
  if (error) throw error;
}

async function* streamAgentEvents(sessionId: string) {
  let hasMore = true;
  
  while (hasMore) {
    const response = await anthropic.beta.sessions.events.list(sessionId);
    
    // Response is an array-like object with data property
    const events = Array.isArray(response) ? response : (response as any).data || [];
    
    for (const event of events) {
      yield event;
      
      // Check if agent is done processing
      if ((event as any).type === 'status.message' && (event as any).status === 'completed') {
        hasMore = false;
      }
    }
    
    if (hasMore) {
      await delay(1000);
    }
  }
}

export async function GET() {
  const results: ScoutResult[] = [];
  
  try {
    console.log("[Scout] Starting Managed Agent harvest...");

    // 1. Create the Investigative Agent
    const agent = await anthropic.beta.agents.create({
      name: "Snowden Investigative Scout",
      model: "claude-3-5-sonnet-20241022",
      system: `You are an elite investigative journalist with expertise in finding unreported stories.

Your mission: Visit the provided URLs using web_fetch and web_search tools. For each source:
1. Fetch and analyze the content
2. Identify high-impact stories related to: missing persons, genocide, surveillance, human rights, environmental destruction, whistleblowers, or corporate/government misconduct
3. For EACH compelling story found, output a separate JSON object with this exact structure (MUST include a valid absolute source_url pointing to the original item):
{
  "title": "punchy headline",
  "summary": "one sentence why this matters",
  "category": "SURVEILLANCE | HUMANITARIAN | MISSING | POLICY | ENVIRONMENT | CONTRACTS | OTHER",
  "risk_score": <number 1-10>,
  "source_url": "https://..."
}

Be aggressive - default to 6+ for anything with public impact. Separate each JSON object with a newline.`,
      tools: [{ type: "agent_toolset_20260401" }],
    });

    // 2. Create the Session (environment_id is optional)
    const session = await anthropic.beta.sessions.create({
      agent: { type: "agent", id: agent.id, version: agent.version },
      environment_id: process.env.ANTHROPIC_ENVIRONMENT_ID || "",
    } as any);

    // 3. Format targets for the agent
    const targetsList = TARGETS.map((t) => `${t.name}: ${t.url}`).join("\n");

    // 4. Send the command
    await anthropic.beta.sessions.events.send(session.id, {
      events: [
        {
          type: "user.message",
          content: [
            {
              type: "text",
              text: `Scout these targets for investigative leads:\n\n${targetsList}\n\nFor each significant story, output valid JSON.`,
            },
          ],
        },
      ],
    });

    // 5. Listen to the event stream for results
    let agentComplete = false;
    let messageContent = "";

    for await (const event of streamAgentEvents(session.id)) {
      if (event.type === "message") {
        const messageEvent = event as any;
        if (messageEvent.content && Array.isArray(messageEvent.content)) {
          for (const block of messageEvent.content) {
            if (block.type === "text") {
              messageContent += block.text;
            }
          }
        }
      }

      if (event.type === "status.message" && "status" in event && (event as any).status === "completed") {
        agentComplete = true;
      }
    }

    // 6. Parse JSON objects from the message content (expecting source_url included)
    const jsonMatches = messageContent.match(/\{[^{}]*"title"[^{}]*\}/g) || [];

    for (const jsonStr of jsonMatches) {
      try {
        const parsed = JSON.parse(jsonStr) as ScoutResult & { source_url?: string };

        // Validate the structure
        if (parsed.title && parsed.summary && parsed.category && typeof parsed.risk_score === "number") {
          // prefer the parsed source_url if provided
          const sourceUrl = parsed.source_url && parsed.source_url.startsWith("http") ? parsed.source_url : `agent-session-${session.id}`;

          // 7. Save to Supabase
          await publish(parsed, sourceUrl);
          results.push(parsed);
          console.log(`[Scout] Scoop found: ${parsed.title} (risk: ${parsed.risk_score}) -> ${sourceUrl}`);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("[Scout] Failed to parse JSON:", err.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      agent_id: agent.id,
      session_id: session.id,
      scoops_found: results.length,
      results,
    });
  } catch (err) {
    console.error("[Scout] Fatal error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
