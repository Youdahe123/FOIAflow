import type { RequestLaw } from "@/types";

export function getGenerateAppealPrompt(params: {
  originalRequest: string;
  agencyName: string;
  denialReason: string;
  denialDate: string;
  requestLaw?: RequestLaw;
  requestLawName?: string;
}): string {
  const isFoia = !params.requestLaw || params.requestLaw === "foia";
  const isDataPractices = params.requestLaw === "data_practices";

  let lawGuidance: string;
  if (isFoia) {
    lawGuidance = `This is a FEDERAL FOIA appeal. Reference the right to appeal under 5 U.S.C. § 552(a)(6)(A)(i). Cite the foreseeable harm standard from the FOIA Improvement Act of 2016. Note the right to judicial review under 5 U.S.C. § 552(a)(4)(B) and the 20-business-day deadline for appeals.`;
  } else if (isDataPractices) {
    lawGuidance = `This is an appeal under the Minnesota Government Data Practices Act (Minn. Stat. Ch. 13). DO NOT reference FOIA or 5 U.S.C. § 552. Under Minnesota law, if data is classified as not public, the requester can challenge the classification. Reference Minn. Stat. § 13.03 (access rights) and Minn. Stat. § 13.08 (civil remedies). Note the right to seek an advisory opinion from the Commissioner of the Department of Administration, or to file a complaint with the Office of Administrative Hearings.`;
  } else {
    lawGuidance = `This is an appeal under ${params.requestLawName ?? "the applicable state public records law"}. DO NOT reference federal FOIA (5 U.S.C. § 552). Use the correct state statute and appeal procedures.`;
  }

  const requestTypeLabel = isDataPractices ? "data request" : isFoia ? "FOIA request" : "public records request";

  return `You are a ${isDataPractices ? "government data access" : "FOIA"} appeals attorney with deep expertise in administrative law and ${isDataPractices ? "data practices" : "freedom of information"} litigation. Your task is to generate a legally precise, persuasive appeal letter.

## Context
- Agency: ${params.agencyName}
- Date of Denial: ${params.denialDate}
- Denial Reason: ${params.denialReason}

## Applicable Law
${lawGuidance}

## Original Request
${params.originalRequest}

## Instructions
Generate a formal appeal letter that:

1. **Identifies the appeal**: Clearly states this is an administrative appeal of a ${requestTypeLabel} denial, referencing the original request and the denial date.

2. **Cites proper authority**: References the correct statute and appeal rights.

3. **Challenges the denial**: Systematically rebuts the stated denial reason. Explain why the exemption or classification was improperly applied.

4. **Requests segregable portions**: Request release of all non-exempt portions that can be reasonably separated.

5. **Notes legal remedies**: Mention the requester's right to seek judicial or administrative review if the appeal is denied.

6. **Uses formal legal language** and professional formatting throughout.

7. Use [DATE] for today's date, [YOUR NAME] for requester name, [YOUR ADDRESS] for address, [YOUR EMAIL] for email.

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "appealLetter": "The full text of the appeal letter",
  "legalBasis": ["Array of legal citations and bases supporting the appeal"],
  "recommendations": ["Array of strategic recommendations for the requester"]
}`;
}
