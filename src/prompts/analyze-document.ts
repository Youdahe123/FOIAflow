export function getAnalyzeDocumentPrompt(params: {
  documentText: string;
  fileName: string;
}): string {
  return `You are an expert government document analyst with deep knowledge of FOIA exemptions, government redaction practices, financial disclosures, and investigative research techniques. Your task is to perform an exhaustive analysis of a document received in response to a FOIA or public records request.

## Document Information
- File Name: ${params.fileName}

## Document Text
${params.documentText}

## Instructions
Perform a comprehensive, meticulous analysis of this document. Your analysis must be thorough enough for an investigative journalist or researcher to act on immediately.

### 1. Summary
Provide a concise 2-4 sentence summary of what the document contains, its significance, and the time period it covers.

### 2. Key Findings
Identify the most important facts, revelations, or pieces of information. Focus on:
- Newsworthy or legally significant content
- Unusual patterns, contradictions, or notable omissions
- Connections between people, organizations, or events
- Any evidence of misconduct, policy violations, or noteworthy decisions

### 3. Redaction Analysis
Identify ALL redactions, withholdings, or blacked-out portions. For each redaction:
- Note the approximate location (page number if discernible, otherwise section/paragraph)
- Describe what appears to be redacted based on surrounding context (names, dates, dollar amounts, communications, etc.)
- Identify the FOIA exemption code cited (e.g., b(1), b(5), b(6), b(7)(A), b(7)(C), b(7)(D), b(7)(E), etc.)
- Provide the full exemption name (e.g., "Exemption 6 - Personal Privacy")
- If no exemption code is visible, infer which exemption likely applies based on context
- **CRITICAL: Provide an educated guess on WHY this specific content was redacted.** Choose from and explain:
  - **Privacy** — protecting personal information (SSNs, home addresses, personal phone numbers)
  - **National Security** — classified information, intelligence sources/methods
  - **Law Enforcement** — protecting ongoing investigations, confidential informants, investigative techniques
  - **Deliberative Process** — internal policy discussions, pre-decisional communications
  - **Attorney-Client** — privileged legal communications
  - **Commercial/Financial** — trade secrets, proprietary business information
  - **Inter/Intra-Agency** — internal memoranda not yet publicly released

### 4. Entity Extraction
Extract ALL key entities mentioned in the document with precision:
- **People**: Full names, titles, roles, organizational affiliations. Count exact mentions.
- **Organizations**: Government agencies, departments, companies, NGOs, contractors. Include abbreviations.
- **Locations**: Cities, states, countries, facilities, addresses mentioned.
- **Dates**: Specific dates, date ranges, time periods referenced.
- **Dollar Amounts**: All monetary figures — budgets, contracts, fees, salaries, fines, grants, expenditures. Include the context for each amount.

Be exhaustive. Even names/entities mentioned once are important for cross-referencing.

### 5. Pattern Detection
Look for and report patterns across the document:
- **Name patterns**: Are certain names consistently appearing together? Are some names redacted while others aren't?
- **Email patterns**: Are email addresses from specific domains recurring? Are personal emails mixed with government emails?
- **Redaction patterns**: Are redactions clustered around specific topics, time periods, or individuals? Is there a pattern to what gets redacted vs. what is released?
- **Communication patterns**: Who is communicating with whom? Are there chains of communication that suggest particular relationships or decision-making flows?
- **Financial patterns**: Are dollar amounts increasing/decreasing over time? Are payments going to the same entities?

### 6. Follow-Up Request Suggestions
Based on your analysis — especially redactions, gaps, and referenced but not included documents — suggest specific, actionable follow-up records requests. Each suggestion must:
- Clearly state WHAT records to request
- Specify WHICH agency to target (be specific — name the agency)
- Explain WHY this follow-up matters (what will it reveal, based on what you found in this document)
- Frame these as ready-to-use descriptions for a new records request

Frame suggestions as: "Based on [specific finding/redaction], you should request [specific records] from [agency] because [reasoning]."

## Response Format
You MUST respond with valid JSON in the following format and nothing else:
{
  "summary": "Concise 2-4 sentence summary of the document and its significance",
  "keyFindings": ["Array of key findings — be specific and actionable"],
  "redactions": [
    {
      "page": 1,
      "description": "Description of what appears to be redacted based on context",
      "exemptionCode": "b(6)",
      "exemptionName": "Exemption 6 - Personal Privacy",
      "likelyReason": "Privacy — this redaction covers what appears to be a personal phone number or home address based on the surrounding formatting"
    }
  ],
  "entities": [
    {
      "name": "Entity name (use full names for people, include title if known)",
      "type": "person|organization|date|location|dollar_amount",
      "mentions": 3
    }
  ],
  "patterns": [
    "Description of a detected pattern — e.g., 'All communications involving [Name] between March-June 2019 are fully redacted under b(5), suggesting deliberative process around a specific policy decision during that period'",
    "Description of another pattern — e.g., 'Email addresses from contractor domain @acmecorp.com appear 12 times but the contract value is consistently redacted, suggesting protected commercial information'"
  ],
  "suggestedFollowUps": [
    {
      "description": "Specific description of what records to request — ready to paste into a new request",
      "suggestedAgency": "Full name of the agency to target",
      "reasoning": "Based on [finding], this follow-up would reveal [what] because [why]"
    }
  ]
}`;
}
