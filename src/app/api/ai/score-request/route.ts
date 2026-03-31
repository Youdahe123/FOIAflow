import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "@/lib/ai";
import { getScoreRequestPrompt } from "@/prompts/score-request";

interface ScoreRequestRequest {
  letterText: string;
}

interface ScoreBreakdown {
  category: string;
  score: number;
  feedback: string;
}

interface ScoreRequestResponse {
  score: number;
  breakdown: ScoreBreakdown[];
  overallFeedback: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScoreRequestRequest;

    if (!body.letterText) {
      return NextResponse.json(
        { error: "Missing required field: letterText" },
        { status: 400 }
      );
    }

    const systemPrompt = getScoreRequestPrompt(body.letterText);

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "Please evaluate the FOIA request letter provided in the system prompt and return a quality score with detailed breakdown.",
        },
      ],
      temperature: 0.3,
    });

    const result = parseJsonResponse<ScoreRequestResponse>(response);

    return NextResponse.json({
      ...result,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Score request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
