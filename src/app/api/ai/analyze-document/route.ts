export const dynamic = 'force-dynamic';

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
  likelyReason: string;
}

interface Entity {
  name: string;
  type: string;
  mentions: number;
}

interface FollowUpSuggestion {
  description: string;
  suggestedAgency: string;
  reasoning: string;
}

interface AnalyzeDocumentResponse {
  summary: string;
  keyFindings: string[];
  redactions: Redaction[];
  entities: Entity[];
  patterns: string[];
  suggestedFollowUps: FollowUpSuggestion[];
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
          content: `Analyze the document "${body.fileName}" provided in the system prompt. Extract all names, agencies, dates, dollar amounts, and locations. Identify every redaction and explain why it was likely redacted. Detect patterns across names, emails, and redactions. Suggest specific follow-up requests based on your findings.`,
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
