export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { callAIStream } from "@/lib/ai";
import type { RequestLaw } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.description || !body.agencyName || !body.jurisdiction) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestLaw: RequestLaw = body.requestLaw ?? (body.jurisdiction === "Federal" ? "foia" : "state_foia");
    const requestLawName: string = body.requestLawName ?? (body.jurisdiction === "Federal" ? "Freedom of Information Act (5 U.S.C. § 552)" : "State Public Records Act");
    const isFoia = requestLaw === "foia";
    const isDataPractices = requestLaw === "data_practices";

    let statuteText: string;
    let officerTitle: string;
    let feeText: string;
    let deadlineText: string;
    let requestTypeLabel: string;

    if (isFoia) {
      statuteText = "5 U.S.C. § 552";
      officerTitle = body.foiaOfficer || "FOIA Officer";
      feeText = "Include a fee waiver request citing news media / public interest grounds\n- State willingness to pay up to $25 if fee waiver denied";
      deadlineText = "Reference the 20-business-day statutory response deadline";
      requestTypeLabel = "FOIA";
    } else if (isDataPractices) {
      statuteText = "Minnesota Statutes, Chapter 13 (the Minnesota Government Data Practices Act)";
      officerTitle = body.foiaOfficer || "Responsible Authority";
      feeText = "Note that fees under Minn. Stat. § 13.03 may not exceed actual cost of searching, retrieving, and copying the data\n- Request electronic format if data is maintained electronically";
      deadlineText = "Note that the agency must respond within a reasonable time";
      requestTypeLabel = "Data Practices";
    } else {
      statuteText = requestLawName;
      officerTitle = body.foiaOfficer || "Public Records Officer";
      feeText = "Include a fee waiver request citing applicable state provisions for news media or public interest\n- State willingness to pay up to $25 if fee waiver denied";
      deadlineText = "Reference the applicable statutory response deadline";
      requestTypeLabel = "public records";
    }

    const systemPrompt = `You are a ${isDataPractices ? "government data access legal expert" : "FOIA legal expert"}. Generate a legally precise, ready-to-send ${requestTypeLabel} request letter.

Write ONLY the letter text — no JSON, no markdown, no explanation. Just the letter itself.
${isDataPractices ? "\nCRITICAL: Do NOT use the words \"FOIA\", \"Freedom of Information\", or reference 5 U.S.C. § 552 anywhere. This is a Minnesota Data Practices Act request.\n" : ""}
Requirements:
- Address it to: ${officerTitle}, ${body.agencyName}${body.agencyAddress ? `\n  ${body.agencyAddress}` : ""}${body.foiaEmail ? `\n  ${body.foiaEmail}` : ""}
- Start with [DATE] for the date
- Cite ${statuteText} as the statutory basis
- Include a detailed, specific description of records requested based on the user's description
- Request records in electronic format
- ${feeText}
- ${deadlineText}
- Close with [YOUR NAME], [YOUR ORGANIZATION], [YOUR EMAIL], [YOUR PHONE] placeholders
- Use formal legal language throughout`;

    const { stream } = callAIStream({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a ${requestTypeLabel} request letter for the following:\n\n${body.description}`,
        },
      ],
      temperature: 0.4,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
