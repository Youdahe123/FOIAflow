import { NextRequest } from "next/server";
import { callAIStream } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.description || !body.agencyName || !body.jurisdiction) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const jurisdictionText =
      body.jurisdiction === "Federal"
        ? "5 U.S.C. § 552"
        : body.jurisdiction === "State"
          ? "the applicable state public records statute"
          : "applicable local open records laws";

    const systemPrompt = `You are a FOIA legal expert. Generate a legally precise, ready-to-send FOIA request letter.

Write ONLY the letter text — no JSON, no markdown, no explanation. Just the letter itself.

Requirements:
- Address it to: ${body.foiaOfficer || "FOIA Officer"}, ${body.agencyName}${body.agencyAddress ? `\n  ${body.agencyAddress}` : ""}${body.foiaEmail ? `\n  ${body.foiaEmail}` : ""}
- Start with [DATE] for the date
- Cite ${jurisdictionText} as the statutory basis
- Include a detailed, specific description of records requested based on the user's description
- Request records in electronic format
- Include a fee waiver request citing news media / public interest grounds
- State willingness to pay up to $25 if fee waiver denied
- Reference the statutory response deadline (20 business days for federal)
- Close with [YOUR NAME], [YOUR ORGANIZATION], [YOUR EMAIL], [YOUR PHONE] placeholders
- Use formal legal language throughout`;

    const { stream } = callAIStream({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a FOIA request letter for the following:\n\n${body.description}`,
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
