"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createRequest, logActivity } from "@/lib/db";
import type { Agency, AgencyLevel } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = ["Describe", "Select Agency", "Review", "File"] as const;

const SUGGESTION_CHIPS = [
  "Records about...",
  "Communications between...",
  "Contracts related to...",
  "Internal policies on...",
];

const SAMPLE_LETTER = `[Current Date]

FOIA Officer
Federal Bureau of Investigation
Record/Information Dissemination Section
170 Marcel Drive
Winchester, VA 22602

Re: Freedom of Information Act Request

Dear FOIA Officer:

Pursuant to the Freedom of Information Act, 5 U.S.C. \u00a7 552, I hereby request access to and copies of the following records:

All records, documents, communications, contracts, memoranda, and reports related to the Federal Bureau of Investigation\u2019s use, acquisition, deployment, and evaluation of facial recognition technology from January 1, 2020 through the present date, including but not limited to:

1. Contracts and procurement records with facial recognition technology vendors;
2. Internal memoranda and policy documents governing the use of facial recognition;
3. Training materials provided to agents and personnel;
4. Accuracy and bias audits or assessments;
5. Communications with other federal, state, or local agencies regarding facial recognition.

I am a representative of the news media as defined under 5 U.S.C. \u00a7 552(a)(4)(A)(ii)(II), and this request is made as part of news gathering and not for commercial use. I therefore request a waiver of all fees associated with this request.

If my request is denied in whole or in part, I ask that you justify all deletions by reference to specific exemptions of the Act. I reserve the right to appeal any decision to withhold information.

I look forward to your response within 20 business days, as required by law.

Sincerely,
[Your Name]
[Your Organization]
[Your Email]
[Your Phone]`;

const IMPROVEMENT_SUGGESTIONS = [
  "Consider specifying a narrower date range to increase likelihood of timely processing.",
  "Add specific record types (e.g., emails, memoranda, contracts) for a more targeted request.",
  "Reference relevant case precedents to strengthen fee waiver justification.",
];

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
    </svg>
  );
}

function LightBulbIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 00-2.905 3.75.75.75 0 01-.542.868A1.5 1.5 0 008 14.5h4a1.5 1.5 0 001.447-1.882.75.75 0 01-.542-.868A3 3 0 0010 7zM1 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 011 10zm15 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0116 10zm-8 4a.75.75 0 000 1.5h4a.75.75 0 000-1.5H8zm.75 3a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper: render star rating
// ---------------------------------------------------------------------------

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-sm text-warning" aria-label={`${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) =>
        i < filled ? "\u2605" : "\u2606",
      ).join("")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: readonly string[];
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  isCompleted &&
                    "bg-primary border-primary text-white",
                  isCurrent &&
                    "bg-primary border-primary text-white",
                  isUpcoming &&
                    "bg-surface border-border text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-xs mt-1.5 whitespace-nowrap",
                  isCurrent
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-20 h-0.5 mx-2 mt-[-1rem]",
                  idx < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quality score display
// ---------------------------------------------------------------------------

function QualityScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-success"
      : score >= 60
        ? "text-warning"
        : "text-danger";
  const bgColor =
    score >= 80
      ? "border-success"
      : score >= 60
        ? "border-warning"
        : "border-danger";
  const label =
    score >= 80
      ? "Good \u2014 Minor improvements suggested"
      : score >= 60
        ? "Fair \u2014 Several improvements recommended"
        : "Needs Work \u2014 Significant improvements needed";

  // SVG circle progress
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-6 mb-6">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="square"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-heading text-2xl", color)}>{score}</span>
        </div>
      </div>
      <div>
        <p className={cn("text-sm font-medium", color)}>Quality Score</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QualityScoreMini({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-success"
      : score >= 60
        ? "text-warning"
        : "text-danger";

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
      <span className={cn("font-heading text-lg", color)}>{score}</span>
      <span className="text-xs text-muted-foreground">Quality Score</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function RequestBuilderPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Loading...</div>}>
      <RequestBuilderContent />
    </Suspense>
  );
}

function RequestBuilderContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<Set<string>>(new Set());
  const [letterText, setLetterText] = useState(SAMPLE_LETTER);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFilingMethod, setSelectedFilingMethod] = useState<
    "email" | "pdf" | "clipboard"
  >("email");
  const [agencySearch, setAgencySearch] = useState("");
  const [agencyLevelFilter, setAgencyLevelFilter] = useState<
    AgencyLevel | "all"
  >("all");

  const [qualityScore, setQualityScore] = useState(82);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [improvements, setImprovements] = useState<string[]>(IMPROVEMENT_SUGGESTIONS);
  const [isBroadRequest, setIsBroadRequest] = useState(false);
  const [broadRequestWarning, setBroadRequestWarning] = useState<string | null>(null);
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [bulkResults, setBulkResults] = useState<{
    sent: number;
    failed: number;
    sentFrom?: string;
    results: { agencyName: string; status: string; email: string }[];
    skipped: { agencyId: string; reason: string }[];
  } | null>(null);

  // Google account connection state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agencies?limit=200")
      .then((res) => res.json())
      .then((json) => setAgencies(json.data ?? []))
      .catch(() => setAgencies([]));

    // Check if Google/Gmail is connected
    fetch("/api/google/status")
      .then((res) => res.json())
      .then((data) => {
        setGmailConnected(data.connected);
        setGmailEmail(data.email ?? null);
      })
      .catch(() => {});
  }, []);

  // Pre-fill from Document Intel follow-up suggestions
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setDescription(prefill);
    }
  }, [searchParams]);

  // Filtered agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) => {
      const matchesSearch =
        agencySearch.trim() === "" ||
        agency.name.toLowerCase().includes(agencySearch.toLowerCase()) ||
        agency.abbreviation.toLowerCase().includes(agencySearch.toLowerCase());
      const matchesLevel =
        agencyLevelFilter === "all" || agency.level === agencyLevelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [agencySearch, agencyLevelFilter, agencies]);

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);
  const selectedAgencies = agencies.filter((a) => selectedAgencyIds.has(a.id));

  // Toggle an agency in multi-select mode
  function toggleAgencySelection(agencyId: string) {
    setSelectedAgencyIds((prev) => {
      const next = new Set(prev);
      if (next.has(agencyId)) {
        next.delete(agencyId);
      } else {
        next.add(agencyId);
      }
      return next;
    });
  }

  // Customize letter for a specific agency (simple find/replace)
  function customizeLetterForAgency(baseLetter: string, agency: Agency): string {
    let letter = baseLetter;
    if (selectedAgency) {
      letter = letter.replaceAll(selectedAgency.name, agency.name);
      if (selectedAgency.mailingAddress && agency.mailingAddress) {
        letter = letter.replaceAll(selectedAgency.mailingAddress, agency.mailingAddress);
      }
      if (selectedAgency.foiaOfficer && agency.foiaOfficer) {
        letter = letter.replaceAll(selectedAgency.foiaOfficer, agency.foiaOfficer);
      } else if (selectedAgency.foiaOfficer && !agency.foiaOfficer) {
        letter = letter.replaceAll(selectedAgency.foiaOfficer, "FOIA Officer");
      }
      if (selectedAgency.foiaEmail && agency.foiaEmail) {
        letter = letter.replaceAll(selectedAgency.foiaEmail, agency.foiaEmail);
      }
      // Replace request law name if different
      if (selectedAgency.requestLawName !== agency.requestLawName) {
        letter = letter.replaceAll(selectedAgency.requestLawName, agency.requestLawName);
      }
    }
    return letter;
  }

  // Step validation
  const canContinue = (): boolean => {
    if (currentStep === 0) return description.trim().length > 0;
    if (currentStep === 1) {
      if (multiSelect) return selectedAgencyIds.size > 0;
      return selectedAgencyId !== null;
    }
    return true;
  };

  // Generate FOIA letter via AI with streaming
  async function generateLetter() {
    if (!selectedAgency) return;
    setGenerating(true);
    setAiError(null);
    setLetterText("");

    try {
      const res = await fetch("/api/ai/generate-letter-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          agencyId: selectedAgency.id,
          agencyName: selectedAgency.name,
          agencyAddress: selectedAgency.mailingAddress,
          foiaOfficer: selectedAgency.foiaOfficer,
          jurisdiction: selectedAgency.level === "federal" ? "Federal" : selectedAgency.level === "state" ? "State" : "Local",
          requestLaw: selectedAgency.requestLaw,
          requestLawName: selectedAgency.requestLawName,
          foiaEmail: selectedAgency.foiaEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate letter");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.text) {
              fullText += data.text;
              setLetterText(fullText);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              // only throw real errors, not parse errors from partial chunks
              if (e.message.startsWith("OpenAI")) throw e;
            }
          }
        }
      }

      // Score the completed letter in background
      if (fullText) {
        scoreLetterInBackground(fullText);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate letter");
    } finally {
      setGenerating(false);
    }
  }

  // Score letter in background
  async function scoreLetterInBackground(letter: string) {
    setScoring(true);
    setIsBroadRequest(false);
    setBroadRequestWarning(null);
    try {
      const res = await fetch("/api/ai/score-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterText: letter,
          requestLaw: selectedAgency?.requestLaw,
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.score === "number") {
        setQualityScore(data.score);
      }
      if (res.ok && data.isBroadRequest) {
        setIsBroadRequest(true);
        setBroadRequestWarning(data.broadRequestWarning ?? "This request is very broad and may result in significant processing delays and fees. Consider narrowing by keyword, sender, date range, or department.");
      }
    } catch {
      // Non-critical — keep default score
    } finally {
      setScoring(false);
    }
  }

  // Regenerate letter
  async function handleRegenerate() {
    await generateLetter();
  }

  const handleContinue = async () => {
    if (!canContinue() || currentStep >= STEPS.length - 1) return;

    // When moving from agency selection to review, generate the letter
    if (currentStep === 1) {
      // In multi-select mode, set the first selected agency as primary for letter generation
      if (multiSelect && selectedAgencyIds.size > 0 && !selectedAgencyId) {
        const firstId = Array.from(selectedAgencyIds)[0];
        setSelectedAgencyId(firstId);
      }
      const primary = multiSelect
        ? agencies.find((a) => a.id === Array.from(selectedAgencyIds)[0])
        : selectedAgency;
      if (primary) {
        // Ensure selectedAgencyId is set for letter generation
        if (multiSelect) setSelectedAgencyId(primary.id);
        setCurrentStep(currentStep + 1);
        await generateLetter();
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // File the request to the database (single or mass)
  async function handleFileRequest() {
    if (!selectedAgency) return;
    setFiling(true);
    setBulkResults(null);
    try {
      // Determine email endpoint: Gmail (user's account) or Resend (noreply)
      const useGmail = gmailConnected && selectedFilingMethod === "email";
      const bulkEndpoint = useGmail ? "/api/email/gmail-bulk" : "/api/email/bulk";
      const singleEndpoint = useGmail ? "/api/email/gmail" : "/api/email/send";

      // Mass email: multi-select mode with email filing method
      if (multiSelect && selectedAgencyIds.size > 1 && selectedFilingMethod === "email") {
        const items = Array.from(selectedAgencyIds).map((agencyId) => {
          const agency = agencies.find((a) => a.id === agencyId);
          if (!agency) return null;
          const customizedLetter = agencyId === selectedAgency.id
            ? letterText
            : customizeLetterForAgency(letterText, agency);
          return {
            agencyId,
            subject: `FOIA Request — ${description.trim().slice(0, 60)}`,
            letter: customizedLetter,
          };
        }).filter(Boolean);

        const res = await fetch(bulkEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            description,
            qualityScore,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setBulkResults(data);
        }

        setFiled(true);
        return;
      }

      // Single agency filing
      const title = description.trim().slice(0, 60);
      const result = await createRequest({
        title,
        description,
        generatedLetter: letterText,
        agencyId: selectedAgency.id,
        agencyName: selectedAgency.name,
        status: "filed",
        qualityScore,
      });

      // Send the email when email method is selected
      if (selectedFilingMethod === "email" && selectedAgency.foiaEmail) {
        await fetch(singleEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: selectedAgency.foiaEmail,
            subject: `FOIA Request — ${title}`,
            body: letterText,
          }),
        });
      }

      if (selectedFilingMethod === "clipboard") {
        await navigator.clipboard.writeText(letterText);
      }

      await logActivity(
        "filed_request",
        `Filed FOIA request: ${title}`,
        result?.id,
      );

      setFiled(true);
    } catch (err) {
      console.error("Filing error:", err);
    } finally {
      setFiling(false);
    }
  }

  // Save as draft
  async function handleSaveAsDraft() {
    if (!selectedAgency) return;
    setFiling(true);
    try {
      const title = description.trim().slice(0, 60);
      const result = await createRequest({
        title,
        description,
        generatedLetter: letterText,
        agencyId: selectedAgency.id,
        agencyName: selectedAgency.name,
        status: "draft",
        qualityScore,
      });

      await logActivity(
        "saved_draft",
        `Saved FOIA request draft: ${title}`,
        result?.id,
      );

      setFiled(true);
    } catch (err) {
      console.error("Save draft error:", err);
    } finally {
      setFiling(false);
    }
  }

  // Reset form for "Create Another"
  function resetForm() {
    setCurrentStep(0);
    setDescription("");
    setSelectedAgencyId(null);
    setMultiSelect(false);
    setSelectedAgencyIds(new Set());
    setLetterText(SAMPLE_LETTER);
    setIsEditing(false);
    setSelectedFilingMethod("email");
    setAgencySearch("");
    setAgencyLevelFilter("all");
    setQualityScore(82);
    setGenerating(false);
    setScoring(false);
    setAiError(null);
    setImprovements(IMPROVEMENT_SUGGESTIONS);
    setFiling(false);
    setFiled(false);
    setIsBroadRequest(false);
    setBroadRequestWarning(null);
    setBulkResults(null);
  }

  // Build a preview letter based on description for live preview
  const previewLetter = useMemo(() => {
    if (currentStep === 0 && description.trim()) {
      return `[Current Date]\n\nRecords Officer\n[Agency Name]\n[Agency Address]\n\nRe: Public Records Request\n\nDear Records Officer:\n\nPursuant to applicable open records law, I hereby request access to and copies of the following records:\n\n${description.trim()}\n\n[Letter content will be generated based on your description and the agency you select...]\n\nSincerely,\n[Your Name]`;
    }
    return letterText;
  }, [currentStep, description, letterText]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-3xl text-foreground">
          Request Builder
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a legally precise records request in minutes.
        </p>
      </div>

      {/* Follow-up from Document Intel banner */}
      {searchParams.get("prefill") && currentStep === 0 && (
        <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="text-primary flex-shrink-0 mt-0.5"
          >
            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">
              Follow-up request from Document Intel
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This request was pre-filled based on analysis of a previous document. Review the description and select an agency to continue.
            </p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {/* ================================================================== */}
      {/* Two-panel layout                                                    */}
      {/* ================================================================== */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ============== Left Panel — Form Steps ============== */}
        <div className="lg:w-3/5">
          {/* -------------------------------------------------------------- */}
          {/* STEP 1: Describe                                                */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl text-foreground">
                  Describe your request
                </h2>
                <p className="text-muted-foreground mt-1">
                  Tell us what information you need in plain language. Our AI
                  will generate a legally precise FOIA letter.
                </p>
              </div>

              <Textarea
                rows={6}
                placeholder="e.g., I want all records related to the FBI's use of facial recognition technology between 2020-2024, including contracts, internal memos, and training materials."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-base"
              />

              {/* Suggestion chips */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setDescription((prev) =>
                          prev
                            ? `${prev} ${chip}`
                            : chip,
                        )
                      }
                      className="border border-border bg-muted px-3 py-1 text-sm text-foreground cursor-pointer hover:border-primary transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!canContinue()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* STEP 2: Select Agency                                           */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl text-foreground">
                    {multiSelect ? "Select agencies" : "Select an agency"}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {multiSelect
                      ? "Choose multiple agencies to mass-file your request."
                      : "Choose the government agency to file your request with."}
                  </p>
                </div>
                {/* Multi-select toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setMultiSelect(!multiSelect);
                    if (!multiSelect && selectedAgencyId) {
                      setSelectedAgencyIds(new Set([selectedAgencyId]));
                    } else if (multiSelect) {
                      setSelectedAgencyIds(new Set());
                    }
                  }}
                  className={cn(
                    "flex-shrink-0 border px-3 py-1.5 text-xs font-medium transition-colors",
                    multiSelect
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground hover:border-primary/40",
                  )}
                >
                  {multiSelect ? `Multi (${selectedAgencyIds.size})` : "Select Multiple"}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agencies..."
                  value={agencySearch}
                  onChange={(e) => setAgencySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter row */}
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    ["all", "All"],
                    ["federal", "Federal"],
                    ["state", "State"],
                    ["local", "Local"],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={agencyLevelFilter === value ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setAgencyLevelFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
                {/* Select All / Deselect All in multi mode */}
                {multiSelect && (
                  <>
                    <div className="w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const ids = new Set(filteredAgencies.map((a) => a.id));
                        setSelectedAgencyIds(ids);
                      }}
                    >
                      Select All ({filteredAgencies.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgencyIds(new Set())}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>

              {/* Selected count banner */}
              {multiSelect && selectedAgencyIds.size > 0 && (
                <div className="bg-primary/5 border border-primary/20 px-4 py-2 flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{selectedAgencyIds.size}</span> {selectedAgencyIds.size === 1 ? "agency" : "agencies"} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Letters will be customized for each agency
                  </p>
                </div>
              )}

              {/* Agency grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredAgencies.map((agency) => {
                  const isSelected = multiSelect
                    ? selectedAgencyIds.has(agency.id)
                    : selectedAgencyId === agency.id;
                  return (
                    <button
                      key={agency.id}
                      type="button"
                      onClick={() => {
                        if (multiSelect) {
                          toggleAgencySelection(agency.id);
                        } else {
                          setSelectedAgencyId(agency.id);
                        }
                      }}
                      className={cn(
                        "text-left border p-4 transition-colors cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {multiSelect && (
                            <div
                              className={cn(
                                "mt-0.5 flex-shrink-0 w-4 h-4 border flex items-center justify-center",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border bg-white",
                              )}
                            >
                              {isSelected && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                          )}
                          <p className="text-sm font-medium text-foreground">
                            {agency.name}
                          </p>
                        </div>
                        <Badge variant="outline" size="sm">
                          {agency.abbreviation}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge
                          variant="default"
                          size="sm"
                          className="capitalize"
                        >
                          {agency.level}
                        </Badge>
                        <Badge
                          variant={agency.requestLaw === "foia" ? "primary" : agency.requestLaw === "data_practices" ? "warning" : "default"}
                          size="sm"
                        >
                          {agency.requestLaw === "foia" ? "FOIA" : agency.requestLaw === "data_practices" ? "Data Practices Act" : "Public Records"}
                        </Badge>
                        <StarRating rating={agency.complianceRating} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Avg. response: {agency.averageResponseDays} days
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* AI suggestion link */}
              <p className="text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Not sure? Let AI suggest
                </button>
              </p>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={!canContinue()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* STEP 3: Review Letter                                           */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl text-foreground">
                  Review your {selectedAgency?.requestLaw === "data_practices" ? "data request" : selectedAgency?.requestLaw === "foia" ? "FOIA" : "records request"} letter
                </h2>
                <p className="text-muted-foreground mt-1">
                  AI-generated based on your description
                  {selectedAgency
                    ? ` for ${selectedAgency.name}`
                    : ""}
                  . Review and edit as needed.
                  {multiSelect && selectedAgencyIds.size > 1 && (
                    <span className="block mt-1 text-primary font-medium">
                      This letter will be auto-customized for all {selectedAgencyIds.size} selected agencies on filing.
                    </span>
                  )}
                </p>
              </div>

              {/* AI Error */}
              {aiError && (
                <div className="border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {aiError}
                  <button onClick={handleRegenerate} className="ml-2 underline font-medium">
                    Retry
                  </button>
                </div>
              )}

              {/* Quality score */}
              {scoring ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Scoring letter...
                </div>
              ) : (
                <QualityScoreCircle score={qualityScore} />
              )}

              {/* Broad request warning */}
              {isBroadRequest && broadRequestWarning && (
                <div className="border-2 border-warning bg-warning/5 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="text-warning flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Broad Request Detected — Likely Delays &amp; Fees
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {broadRequestWarning}
                      </p>
                      <p className="text-sm text-primary mt-2 font-medium">
                        Consider going back to Step 1 to narrow your request with specific keywords, senders, date ranges, or departments.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Letter container */}
              <div className="border border-border bg-white p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Generated Letter
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={isEditing ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={generating}
                    >
                      {isEditing ? "Done Editing" : "Edit Letter"}
                    </Button>
                  </div>
                </div>

                {generating && !letterText ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Connecting to AI...</p>
                  </div>
                ) : generating && letterText ? (
                  <div className="font-document text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {letterText}
                    <span
                      className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-baseline"
                      style={{ animation: "cursor-blink 0.8s step-end infinite" }}
                    />
                  </div>
                ) : isEditing ? (
                  <textarea
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    className="w-full font-document text-sm leading-relaxed text-foreground bg-transparent border-none outline-none resize-y min-h-[500px] focus:ring-0"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                ) : (
                  <div
                    className="font-document text-sm leading-relaxed text-foreground whitespace-pre-wrap"
                  >
                    {letterText}
                  </div>
                )}
              </div>

              {/* Regenerate */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={handleRegenerate}
                loading={generating}
                disabled={generating}
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Regenerate Letter
              </Button>

              {/* Improvement suggestions */}
              <div className="bg-muted border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="h-4 w-4 text-warning" />
                  <p className="text-sm font-medium text-foreground">
                    AI Suggestions
                  </p>
                </div>
                <ul className="space-y-2">
                  {improvements.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-muted-foreground mt-0.5 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* STEP 4: File Request                                            */}
          {/* -------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl text-foreground">
                  File your request
                </h2>
                <p className="text-muted-foreground mt-1">
                  Choose how you want to submit your {selectedAgency?.requestLaw === "data_practices" ? "data request" : "records request"}.
                </p>
              </div>

              {/* Summary card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {multiSelect && selectedAgencyIds.size > 1 ? "Agencies" : "Agency"}
                      </p>
                      {multiSelect && selectedAgencyIds.size > 1 ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-base font-medium text-foreground">
                            {selectedAgencyIds.size} agencies selected
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedAgencies.slice(0, 8).map((a) => (
                              <Badge key={a.id} variant="outline" size="sm">
                                {a.abbreviation || a.name.slice(0, 20)}
                              </Badge>
                            ))}
                            {selectedAgencies.length > 8 && (
                              <Badge variant="outline" size="sm">
                                +{selectedAgencies.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-base font-medium text-foreground mt-0.5">
                          {selectedAgency?.name ?? "No agency selected"}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        qualityScore >= 80
                          ? "success"
                          : qualityScore >= 60
                            ? "warning"
                            : "danger"
                      }
                    >
                      Score: {qualityScore}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Letter Preview
                    </p>
                    <p className="text-sm text-foreground mt-1 line-clamp-2">
                      {letterText.split("\n").filter(Boolean).slice(0, 2).join(" ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Filing method options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Filing Method
                </p>

                {/* Email */}
                <button
                  type="button"
                  onClick={() => setSelectedFilingMethod("email")}
                  className={cn(
                    "w-full text-left border p-4 flex items-start gap-4 transition-colors cursor-pointer",
                    selectedFilingMethod === "email"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <MailIcon
                    className={cn(
                      "mt-0.5 flex-shrink-0",
                      selectedFilingMethod === "email"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Email directly
                      {gmailConnected && (
                        <span className="ml-2 text-xs font-normal text-primary">
                          via Gmail
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {gmailConnected
                        ? `Send from ${gmailEmail} to the agency's FOIA office`
                        : "Send via FOIAflow to the agency's FOIA office"}
                    </p>
                    {!gmailConnected && (
                      <a
                        href="/settings"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Connect Google to send from your account
                      </a>
                    )}
                  </div>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => setSelectedFilingMethod("pdf")}
                  className={cn(
                    "w-full text-left border p-4 flex items-start gap-4 transition-colors cursor-pointer",
                    selectedFilingMethod === "pdf"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <DownloadIcon
                    className={cn(
                      "mt-0.5 flex-shrink-0",
                      selectedFilingMethod === "pdf"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Download PDF
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download the letter as a PDF for manual submission
                    </p>
                  </div>
                </button>

                {/* Copy to clipboard */}
                <button
                  type="button"
                  onClick={() => setSelectedFilingMethod("clipboard")}
                  className={cn(
                    "w-full text-left border p-4 flex items-start gap-4 transition-colors cursor-pointer",
                    selectedFilingMethod === "clipboard"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <CopyIcon
                    className={cn(
                      "mt-0.5 flex-shrink-0",
                      selectedFilingMethod === "clipboard"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Copy to clipboard
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copy the full letter text
                    </p>
                  </div>
                </button>
              </div>

              {filed ? (
                /* ---- Success state ---- */
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckIcon className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-heading text-2xl text-foreground">
                    {bulkResults
                      ? `${bulkResults.sent} Request${bulkResults.sent !== 1 ? "s" : ""} Filed`
                      : "Request Filed Successfully"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {bulkResults
                      ? `Sent to ${bulkResults.sent} ${bulkResults.sent === 1 ? "agency" : "agencies"}${bulkResults.failed > 0 ? `, ${bulkResults.failed} failed` : ""}${bulkResults.sentFrom ? ` from ${bulkResults.sentFrom}` : ""}. Track progress in the Tracker.`
                      : "Your FOIA request has been filed. You can track its progress in the Tracker."}
                  </p>

                  {/* Bulk results breakdown */}
                  {bulkResults && bulkResults.results.length > 0 && (
                    <div className="w-full max-w-md text-left border border-border bg-surface divide-y divide-border max-h-[200px] overflow-y-auto">
                      {bulkResults.results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {r.agencyName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.email}
                            </p>
                          </div>
                          <Badge
                            variant={r.status === "sent" ? "success" : "danger"}
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </div>
                      ))}
                      {bulkResults.skipped.map((s, i) => (
                        <div key={`skip-${i}`} className="flex items-center justify-between px-3 py-2">
                          <p className="text-sm text-muted-foreground truncate">
                            {s.reason}
                          </p>
                          <Badge variant="warning" size="sm">
                            skipped
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Link href="/tracker">
                      <Button variant="primary">View in Tracker</Button>
                    </Link>
                    <Button variant="outline" onClick={resetForm}>
                      Create Another
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* File button */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleFileRequest}
                    loading={filing}
                    disabled={filing}
                  >
                    {multiSelect && selectedAgencyIds.size > 1
                      ? `File ${selectedAgencyIds.size} Requests`
                      : "File Request"}
                  </Button>

                  {/* Bottom navigation */}
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={handleBack} disabled={filing}>
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveAsDraft}
                      disabled={filing}
                    >
                      Save as Draft
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ============== Right Panel — Live Letter Preview ============== */}
        <div className="lg:w-2/5">
          <div className="lg:sticky lg:top-24">
            <div className="border border-border bg-surface">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading text-lg text-foreground">
                  Letter Preview
                </h3>
              </div>
              <div className="p-4">
                {description.trim() || currentStep > 0 ? (
                  <>
                    <div className="border border-border bg-white p-4 max-h-[500px] overflow-y-auto">
                      <div className="font-document text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {previewLetter}
                      </div>
                    </div>
                    {currentStep >= 2 && (
                      <QualityScoreMini score={qualityScore} />
                    )}
                  </>
                ) : (
                  <div className="border border-border bg-muted/50 p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="text-muted-foreground text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-10 w-10 mx-auto mb-3 text-border"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <p className="text-sm">
                        Your letter will appear here as you describe your
                        request.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected agency info (shown in step 2+) */}
            {currentStep >= 1 && multiSelect && selectedAgencies.length > 0 ? (
              <div className="border border-border bg-surface mt-4 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                  Selected Agencies ({selectedAgencies.length})
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedAgencies.map((a) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {a.abbreviation || a.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.foiaEmail || "No email"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAgencySelection(a.id)}
                        className="text-xs text-muted-foreground hover:text-danger ml-2 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedAgency && currentStep >= 1 ? (
              <div className="border border-border bg-surface mt-4 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                  Selected Agency
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedAgency.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" size="sm">
                    {selectedAgency.abbreviation}
                  </Badge>
                  <StarRating rating={selectedAgency.complianceRating} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg. response: {selectedAgency.averageResponseDays} days
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAgency.foiaEmail}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
