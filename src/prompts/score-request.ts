import type { RequestLaw } from "@/types";

export function getScoreRequestPrompt(letterText: string, requestLaw?: RequestLaw): string {
  const isFoia = !requestLaw || requestLaw === "foia";
  const isDataPractices = requestLaw === "data_practices";
  const lawLabel = isDataPractices
    ? "Minnesota Government Data Practices Act (Minn. Stat. Ch. 13)"
    : isFoia
      ? "FOIA (5 U.S.C. § 552)"
      : "the applicable state/local public records law";

  return `You are a ${isDataPractices ? "government data access" : "FOIA"} quality assessment expert. Your task is to evaluate a public records request letter and score it on multiple dimensions of quality.

## Letter to Evaluate
${letterText}

## Applicable Law
This letter should be evaluated against ${lawLabel}.
${isDataPractices ? "IMPORTANT: This is NOT a FOIA request. References to FOIA or 5 U.S.C. § 552 are INCORRECT for this request and should lower the Legal Precision score." : ""}

## Scoring Criteria
Evaluate the letter on each of the following categories, scoring each from 0 to 100:

1. **Legal Precision** (0-100): Does the letter correctly cite the applicable statute (${isDataPractices ? "Minn. Stat. Ch. 13" : isFoia ? "5 U.S.C. § 552" : "the correct state statute"})? Are legal references accurate? Does it invoke the correct legal framework? ${isDataPractices ? "Penalize any reference to FOIA or federal statutes." : ""}

2. **Specificity** (0-100): Are the records requested described with sufficient specificity? Does it include date ranges, names, departments, or other narrowing criteria? Would a records officer understand exactly what is being requested?

3. **Completeness** (0-100): Does the letter include all required elements: proper addressee, statutory citation, records description, format preference, fee waiver/fee provisions, contact information, and response deadline reference?

4. **Proper Format** (0-100): Is the letter formatted as a professional legal correspondence? Does it have proper salutation, body paragraphs, and closing? Is the tone appropriately formal?

5. **Fee Waiver Language** (0-100): ${isDataPractices ? "Does the letter correctly reference the fee limitations under Minn. Stat. § 13.03 (fees limited to actual cost of copying)?" : "Does the letter include a fee waiver request? Is it properly grounded in statutory language (news media, public interest, educational institution)? Does it include a fallback willingness to pay with a stated cap?"}

## Broad Request Detection
IMPORTANT: If the request is overly broad (e.g., "all emails", "all communications", "all records" without meaningful narrowing by keyword, sender, date range, or topic), you MUST:
- Lower the Specificity score to below 40
- Include a warning in overallFeedback that this request is likely to result in significant processing delays and/or substantial fees
- Suggest specific ways to narrow the request (e.g., add keywords, limit to specific senders/recipients, narrow the date range, specify departments)

## Overall Score
Calculate an overall score as a weighted average:
- Legal Precision: 25%
- Specificity: 25%
- Completeness: 25%
- Proper Format: 15%
- Fee Waiver Language: 10%

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "score": <overall score 0-100>,
  "isBroadRequest": <true if the request is overly broad and likely to cause delays/fees, false otherwise>,
  "broadRequestWarning": "<if isBroadRequest is true, a clear warning message explaining the potential for delays and fees, and specific suggestions for narrowing the request. null if isBroadRequest is false>",
  "breakdown": [
    {
      "category": "Legal Precision",
      "score": <0-100>,
      "feedback": "Specific feedback on legal precision"
    },
    {
      "category": "Specificity",
      "score": <0-100>,
      "feedback": "Specific feedback on specificity"
    },
    {
      "category": "Completeness",
      "score": <0-100>,
      "feedback": "Specific feedback on completeness"
    },
    {
      "category": "Proper Format",
      "score": <0-100>,
      "feedback": "Specific feedback on format"
    },
    {
      "category": "Fee Waiver Language",
      "score": <0-100>,
      "feedback": "Specific feedback on fee waiver language"
    }
  ],
  "overallFeedback": "A 2-3 sentence summary of the letter's overall quality and the most impactful improvements the requester could make."
}`;
}
