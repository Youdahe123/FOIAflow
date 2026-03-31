export function getAnalyzeDocumentPrompt(params: {
  documentText: string;
  fileName: string;
}): string {
  return `You are a FOIA document analysis expert with deep knowledge of government redaction practices, FOIA exemption codes, and investigative research techniques. Your task is to analyze a document received in response to a FOIA request and provide a comprehensive assessment.

## Document Information
- File Name: ${params.fileName}

## Document Text
${params.documentText}

## Instructions
Perform a thorough analysis of this FOIA response document:

1. **Summary**: Provide a concise 2-4 sentence summary of what the document contains and its significance.

2. **Key Findings**: Identify the most important facts, revelations, or pieces of information in the document. Focus on newsworthy or legally significant content.

3. **Redactions**: Identify any redactions, withholdings, or blacked-out portions. For each redaction:
   - Note the approximate location (page number if discernible, otherwise section)
   - Describe what appears to be redacted based on context
   - Identify the FOIA exemption code cited (e.g., b(1), b(5), b(6), b(7)(A), etc.)
   - Provide the full name of the exemption (e.g., "Exemption 5 - Deliberative Process Privilege")
   - If no exemption code is visible, note that and suggest which exemption likely applies based on the context

4. **Entities**: Extract key entities mentioned in the document:
   - People (names, titles, roles)
   - Organizations (agencies, companies, NGOs)
   - Locations
   - Dates and time periods
   - For each entity, note how many times it appears (approximate if the document is long)

5. **Suggested Follow-Ups**: Based on the document content and any redactions, suggest specific follow-up FOIA requests that could yield additional relevant records. Be specific about what to request and from which agency.

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "summary": "Concise summary of the document",
  "keyFindings": ["Array of key findings from the document"],
  "redactions": [
    {
      "page": 1,
      "description": "Description of what appears to be redacted",
      "exemptionCode": "b(5)",
      "exemptionName": "Exemption 5 - Deliberative Process Privilege"
    }
  ],
  "entities": [
    {
      "name": "Entity name",
      "type": "Person|Organization|Location|Date",
      "mentions": 3
    }
  ],
  "suggestedFollowUps": ["Array of specific follow-up FOIA request suggestions"]
}`;
}
