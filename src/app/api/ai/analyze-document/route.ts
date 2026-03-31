import { NextRequest, NextResponse } from "next/server";
import { callAI, parseJsonResponse } from "@/lib/ai";
import { getAnalyzeDocumentPrompt } from "@/prompts/analyze-document";

interface AnalyzeDocumentRequest {
  documentText: string;
  fileName: string;
}

interface Redaction {
  page: number;
  description: string;
  exemptionCode: string;
  exemptionName: string;
}

interface Entity {
  name: string;
  type: string;
  mentions: number;
}

interface AnalyzeDocumentResponse {
  summary: string;
  keyFindings: string[];
  redactions: Redaction[];
  entities: Entity[];
  suggestedFollowUps: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeDocumentRequest;

    if (!body.documentText || !body.fileName) {
      return NextResponse.json(
        { error: "Missing required fields: documentText, fileName" },
        { status: 400 }
      );
    }

    const systemPrompt = getAnalyzeDocumentPrompt({
      documentText: body.documentText,
      fileName: body.fileName,
    });

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze the FOIA response document "${body.fileName}" provided in the system prompt. Identify all redactions, key entities, and suggest follow-up requests.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 8192,
    });

    const result = parseJsonResponse<AnalyzeDocumentResponse>(response);

    return NextResponse.json({
      ...result,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Analyze document error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
