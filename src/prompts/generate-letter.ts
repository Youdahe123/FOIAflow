import type { RequestLaw } from "@/types";

export function getGenerateLetterPrompt(params: {
  agencyName: string;
  agencyAddress?: string;
  foiaOfficer?: string;
  jurisdiction: "Federal" | "State" | "Local";
  requestLaw: RequestLaw;
  requestLawName: string;
  foiaEmail?: string;
}): string {
  const isFoia = params.requestLaw === "foia";
  const isDataPractices = params.requestLaw === "data_practices";

  let jurisdictionGuidance: string;
  let statuteReference: string;
  let requestTypeName: string;

  if (isFoia) {
    requestTypeName = "Freedom of Information Act (FOIA)";
    statuteReference = "5 U.S.C. § 552";
    jurisdictionGuidance = `This is a FEDERAL FOIA request governed by 5 U.S.C. § 552. Reference the Freedom of Information Act (FOIA), 5 U.S.C. § 552, and all applicable federal regulations (e.g., 28 C.F.R. Part 16 for DOJ). Include the 20-business-day statutory response deadline per 5 U.S.C. § 552(a)(6)(A)(i).`;
  } else if (isDataPractices) {
    requestTypeName = "Minnesota Government Data Practices Act";
    statuteReference = "Minnesota Statutes, Chapter 13";
    jurisdictionGuidance = `This is a request under the Minnesota Government Data Practices Act (Minn. Stat. Ch. 13). DO NOT reference FOIA or the Freedom of Information Act anywhere in this letter. This is NOT a FOIA request.

Key requirements for Minnesota Data Practices requests:
- Reference Minnesota Statutes, Chapter 13 (the Minnesota Government Data Practices Act, or "MGDPA")
- All government data is presumed public unless classified as private or nonpublic by state law
- The responsible authority must respond "as soon as reasonably possible" and not later than a "reasonable time" (there is no fixed statutory deadline like FOIA's 20 days, but agencies typically respond within 10 business days)
- Requesters do NOT need to state a reason for requesting data
- Fees are limited to the actual cost of making copies
- Use "data request" or "public data request" language, NOT "FOIA request"
- Address the letter to the "Responsible Authority" or "Data Practices Compliance Official"`;
  } else {
    // state_foia or open_records
    requestTypeName = params.requestLawName;
    statuteReference = params.requestLawName;
    jurisdictionGuidance = `This is a ${params.jurisdiction === "State" ? "STATE" : "LOCAL"} public records request under ${params.requestLawName}. DO NOT reference the federal FOIA (5 U.S.C. § 552). Instead, cite the correct state statute: ${params.requestLawName}. Use formal language consistent with state-level open records laws. Reference the applicable response deadline and fee provisions from the state statute.`;
  }

  const officerTitle = isDataPractices
    ? "Responsible Authority"
    : "FOIA Officer";
  const officerInstruction = params.foiaOfficer
    ? `use ${officerTitle} name: ${params.foiaOfficer}`
    : `use "${isDataPractices ? "Responsible Authority" : "FOIA Officer"}"`;

  return `You are a ${isDataPractices ? "government data access legal expert" : "FOIA legal expert"} and professional letter drafter. Your task is to generate a legally precise, professionally formatted ${requestTypeName} request letter.

## Agency Details
- Agency Name: ${params.agencyName}
${params.agencyAddress ? `- Agency Address: ${params.agencyAddress}` : ""}
${params.foiaOfficer ? `- ${officerTitle}: ${params.foiaOfficer}` : ""}
${params.foiaEmail ? `- Contact Email: ${params.foiaEmail}` : ""}

## Jurisdiction & Applicable Law
${jurisdictionGuidance}

## Requirements
1. Generate a complete, ready-to-send request letter.
2. Include ALL required statutory elements:
   - Proper salutation and addressee (${officerInstruction})
   - Clear statement that this is a request under ${requestTypeName}
   - Specific citation to ${statuteReference}
   - Detailed description of records/data requested (based on the user's description)
   - Preferred format for receiving records (electronic if possible)
${isFoia ? `   - Fee waiver request citing news media / public interest grounds under 5 U.S.C. § 552(a)(4)(A)(iii) or equivalent
   - Statement of willingness to pay reasonable fees if fee waiver is denied, with a cap (e.g., $25)` : isDataPractices ? `   - Note that under Minn. Stat. § 13.03, fees may not exceed the actual cost of searching for, retrieving, and copying the data
   - Request that data be provided in electronic format if maintained electronically` : `   - Fee waiver request citing applicable state provisions for news media or public interest
   - Statement of willingness to pay reasonable fees with a stated cap (e.g., $25)`}
   - Contact information placeholder for the requester
   - Statement regarding the statutory response deadline
   - Closing with requester's name placeholder
3. Use formal legal language throughout.
4. The letter should be thorough yet concise.
5. Include today's date placeholder as [DATE].
6. Include requester name as [YOUR NAME], address as [YOUR ADDRESS], email as [YOUR EMAIL], phone as [YOUR PHONE].
${isDataPractices ? `7. CRITICAL: Do NOT use the words "FOIA", "Freedom of Information", or reference 5 U.S.C. § 552 anywhere. This is a Minnesota Data Practices Act request.` : ""}

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "letter": "The full text of the request letter",
  "qualityNotes": ["Array of notes about the quality and completeness of the generated letter"],
  "suggestedImprovements": ["Array of suggestions for how the requester could strengthen or narrow the request"]
}`;
}
