import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "@/lib/ai";
import { getGenerateLetterPrompt } from "@/prompts/generate-letter";

interface GenerateLetterRequest {
  description: string;
  agencyId: string;
  agencyName: string;
  agencyAddress?: string;
  foiaOfficer?: string;
  jurisdiction: string;
  foiaEmail?: string;
}

interface GenerateLetterResponse {
  letter: string;
  qualityNotes: string[];
  suggestedImprovements: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateLetterRequest;

    if (!body.description || !body.agencyName || !body.jurisdiction) {
      return NextResponse.json(
        { error: "Missing required fields: description, agencyName, jurisdiction" },
        { status: 400 }
      );
    }

    const validJurisdictions = ["Federal", "State", "Local"];
    if (!validJurisdictions.includes(body.jurisdiction)) {
      return NextResponse.json(
        { error: "jurisdiction must be one of: Federal, State, Local" },
        { status: 400 }
      );
    }

    const systemPrompt = getGenerateLetterPrompt({
      agencyName: body.agencyName,
      agencyAddress: body.agencyAddress,
      foiaOfficer: body.foiaOfficer,
      jurisdiction: body.jurisdiction as "Federal" | "State" | "Local",
      foiaEmail: body.foiaEmail,
    });

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a FOIA request letter for the following records:\n\n${body.description}`,
        },
      ],
      temperature: 0.4,
    });

    const result = parseJsonResponse<GenerateLetterResponse>(response);

    return NextResponse.json({
      ...result,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Generate letter error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
