export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "@/lib/ai";
import { getGenerateAppealPrompt } from "@/prompts/generate-appeal";

interface GenerateAppealRequest {
  originalRequest: string;
  agencyName: string;
  denialReason: string;
  denialDate: string;
}

interface GenerateAppealResponse {
  appealLetter: string;
  legalBasis: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateAppealRequest;

    if (
      !body.originalRequest ||
      !body.agencyName ||
      !body.denialReason ||
      !body.denialDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: originalRequest, agencyName, denialReason, denialDate",
        },
        { status: 400 }
      );
    }

    const systemPrompt = getGenerateAppealPrompt({
      originalRequest: body.originalRequest,
      agencyName: body.agencyName,
      denialReason: body.denialReason,
      denialDate: body.denialDate,
    });

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a FOIA appeal letter challenging the denial from ${body.agencyName} dated ${body.denialDate}. The denial cited: ${body.denialReason}`,
        },
      ],
      temperature: 0.4,
    });

    const result = parseJsonResponse<GenerateAppealResponse>(response);

    return NextResponse.json({
      ...result,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Generate appeal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
