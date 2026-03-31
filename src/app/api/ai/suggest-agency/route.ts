import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "@/lib/ai";
import { getSuggestAgencyPrompt } from "@/prompts/suggest-agency";

interface SuggestAgencyRequest {
  description: string;
}

interface AgencySuggestion {
  agencyName: string;
  relevanceScore: number;
  reasoning: string;
}

interface SuggestAgencyResponse {
  suggestions: AgencySuggestion[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SuggestAgencyRequest;

    if (!body.description) {
      return NextResponse.json(
        { error: "Missing required field: description" },
        { status: 400 }
      );
    }

    const systemPrompt = getSuggestAgencyPrompt(body.description);

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Based on the description provided in the system prompt, suggest the most relevant government agencies to submit a FOIA request to.`,
        },
      ],
      temperature: 0.5,
    });

    const result = parseJsonResponse<SuggestAgencyResponse>(response);

    return NextResponse.json({
      ...result,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Suggest agency error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
