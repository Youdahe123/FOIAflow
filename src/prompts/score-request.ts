export function getScoreRequestPrompt(letterText: string): string {
  return `You are a FOIA quality assessment expert. Your task is to evaluate a FOIA request letter and score it on multiple dimensions of quality.

## Letter to Evaluate
${letterText}

## Scoring Criteria
Evaluate the letter on each of the following categories, scoring each from 0 to 100:

1. **Legal Precision** (0-100): Does the letter correctly cite the applicable FOIA statute (e.g., 5 U.S.C. § 552 for federal)? Are legal references accurate? Does it invoke the correct legal framework?

2. **Specificity** (0-100): Are the records requested described with sufficient specificity? Does it include date ranges, names, departments, or other narrowing criteria? Would an agency records officer understand exactly what is being requested?

3. **Completeness** (0-100): Does the letter include all required elements: proper addressee, statutory citation, records description, format preference, fee waiver request, willingness to pay fees, contact information, and response deadline reference?

4. **Proper Format** (0-100): Is the letter formatted as a professional legal correspondence? Does it have proper salutation, body paragraphs, and closing? Is the tone appropriately formal?

5. **Fee Waiver Language** (0-100): Does the letter include a fee waiver request? Is it properly grounded in statutory language (news media, public interest, educational institution)? Does it include a fallback willingness to pay with a stated cap?

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
