export function getGenerateAppealPrompt(params: {
  originalRequest: string;
  agencyName: string;
  denialReason: string;
  denialDate: string;
}): string {
  return `You are a FOIA appeals attorney with deep expertise in administrative law and freedom of information litigation. Your task is to generate a legally precise, persuasive FOIA administrative appeal letter.

## Context
- Agency: ${params.agencyName}
- Date of Denial: ${params.denialDate}
- Denial Reason: ${params.denialReason}

## Original FOIA Request
${params.originalRequest}

## Instructions
Generate a formal FOIA administrative appeal letter that:

1. **Identifies the appeal**: Clearly states this is an administrative appeal of a FOIA denial, referencing the original request and the denial date.

2. **Cites proper authority**: References the right to appeal under 5 U.S.C. § 552(a)(6)(A)(i) for federal agencies, or the applicable state statute. Cite relevant case law if the denial reason invokes a specific exemption.

3. **Challenges the denial**: Systematically rebuts the stated denial reason. If the agency cited a specific FOIA exemption (e.g., Exemption 5 deliberative process, Exemption 7(A) law enforcement), explain why the exemption was improperly applied or why the agency failed to demonstrate the required elements.

4. **Requests segregable portions**: If full disclosure is arguably exempt, request that the agency release all reasonably segregable, non-exempt portions per 5 U.S.C. § 552(b).

5. **Invokes the foreseeable harm standard**: Reference the FOIA Improvement Act of 2016 requirement that agencies must demonstrate that disclosure would cause foreseeable harm to a protected interest.

6. **Notes litigation rights**: Mention the requester's right to seek judicial review in federal district court under 5 U.S.C. § 552(a)(4)(B) if the appeal is denied.

7. **Sets a deadline**: Note the statutory 20-business-day response deadline for appeals.

8. **Uses formal legal language** and professional formatting throughout.

9. Use [DATE] for today's date, [YOUR NAME] for requester name, [YOUR ADDRESS] for address, [YOUR EMAIL] for email.

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "appealLetter": "The full text of the appeal letter",
  "legalBasis": ["Array of legal citations and bases supporting the appeal"],
  "recommendations": ["Array of strategic recommendations for the requester, such as contacting OGIS, preparing for litigation, or narrowing the request"]
}`;
}
