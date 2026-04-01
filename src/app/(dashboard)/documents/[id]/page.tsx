"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Document, EntityType, Redaction } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEntityBadgeVariant(
  type: EntityType
): "primary" | "success" | "warning" | "default" {
  switch (type) {
    case "person":
      return "primary";
    case "organization":
      return "success";
    case "date":
      return "warning";
    case "dollar_amount":
      return "warning";
    case "location":
      return "default";
  }
}

function getEntityTypeLabel(type: EntityType): string {
  switch (type) {
    case "person":
      return "Person";
    case "organization":
      return "Organization";
    case "date":
      return "Date";
    case "dollar_amount":
      return "Dollar Amount";
    case "location":
      return "Location";
  }
}

// ---------------------------------------------------------------------------
// Document Preview (Fake PDF Viewer)
// ---------------------------------------------------------------------------

function DocumentPreview({ doc }: { doc: Document }) {
  // Generate fake content lines with some "redacted" blocks
  const redactedPages = new Set(
    doc.analysisResult?.redactions.map((r) => r.page) ?? []
  );

  // Create fake text lines that simulate a multi-page document
  const fakePages = useMemo(() => {
    const pages = [];
    const totalVisible = Math.min(doc.pageCount, 4);
    for (let i = 1; i <= totalVisible; i++) {
      const hasRedaction = redactedPages.has(i);
      pages.push({ page: i, hasRedaction });
    }
    return pages;
  }, [doc.pageCount, redactedPages]);

  return (
    <div className="border border-border bg-white flex flex-col min-h-[600px]">
      {/* Viewer Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted">
        <div className="flex items-center gap-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          >
            <path d="M3 2H11L15 6V16H3V2Z" />
            <line x1="11" y1="2" x2="11" y2="6" />
            <line x1="11" y1="6" x2="15" y2="6" />
          </svg>
          <span className="text-sm font-medium text-foreground truncate max-w-[300px]">
            {doc.fileName}
          </span>
          <Badge variant="outline" size="sm">
            {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Zoom out"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="7" x2="11" y2="7" />
            </svg>
          </button>
          <span className="text-xs text-muted-foreground px-1">100%</span>
          <button
            type="button"
            className="h-7 w-7 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Zoom in"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="7" y1="3" x2="7" y2="11" />
              <line x1="3" y1="7" x2="11" y2="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fake Document Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F8F8F6]">
        {fakePages.map((p) => (
          <div
            key={p.page}
            className="bg-white border border-border mx-auto max-w-[560px] p-8 relative"
          >
            {/* Page number */}
            <div className="absolute top-2 right-3 text-xs text-muted-foreground">
              Page {p.page}
            </div>

            {/* Simulated text lines */}
            <div className="space-y-3 mt-4">
              {/* Title line */}
              {p.page === 1 && (
                <div className="h-5 bg-foreground/10 w-3/4 mb-6" />
              )}

              {/* Content lines */}
              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-11/12" />
              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-4/5" />

              {p.hasRedaction && (
                <div className="relative my-4 py-3 px-4 bg-danger/10 border border-danger/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="#CC2222"
                      strokeWidth="1.5"
                    >
                      <rect x="1" y="1" width="12" height="12" />
                      <line x1="1" y1="1" x2="13" y2="13" />
                      <line x1="13" y1="1" x2="1" y2="13" />
                    </svg>
                    <span className="text-xs font-medium text-danger">
                      REDACTED
                    </span>
                  </div>
                  <div className="h-2.5 bg-foreground w-full" />
                  <div className="h-2.5 bg-foreground w-3/4 mt-1" />
                </div>
              )}

              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-10/12" />
              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-9/12" />

              {/* Another redaction area for pages with multiple lines */}
              {p.hasRedaction && p.page > 2 && (
                <div className="relative my-4 py-3 px-4 bg-danger/10 border border-danger/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="#CC2222"
                      strokeWidth="1.5"
                    >
                      <rect x="1" y="1" width="12" height="12" />
                      <line x1="1" y1="1" x2="13" y2="13" />
                      <line x1="13" y1="1" x2="1" y2="13" />
                    </svg>
                    <span className="text-xs font-medium text-danger">
                      REDACTED
                    </span>
                  </div>
                  <div className="h-2.5 bg-foreground w-full" />
                  <div className="h-2.5 bg-foreground w-2/3 mt-1" />
                </div>
              )}

              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-5/6" />
              <div className="h-2.5 bg-foreground/8 w-full" />
              <div className="h-2.5 bg-foreground/8 w-7/12" />
            </div>
          </div>
        ))}

        {doc.pageCount > 4 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            + {doc.pageCount - 4} more pages
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Tab
// ---------------------------------------------------------------------------

function SummaryTab({ doc }: { doc: Document }) {
  if (!doc.analysisResult) {
    return (
      <p className="text-sm text-muted-foreground">
        No analysis results available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {doc.summary && (
        <div>
          <h4 className="font-heading text-sm mb-2">Document Summary</h4>
          <p className="text-sm font-document leading-relaxed text-foreground">
            {doc.summary}
          </p>
        </div>
      )}

      {doc.analysisResult.keyFindings.length > 0 && (
        <div>
          <h4 className="font-heading text-sm mb-3">Key Findings</h4>
          <ul className="space-y-3">
            {doc.analysisResult.keyFindings.map((finding, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-primary/10 text-primary text-xs font-medium mt-0.5">
                  {i + 1}
                </span>
                <span className="font-document leading-relaxed text-foreground">
                  {finding}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Redactions Tab
// ---------------------------------------------------------------------------

function RedactionsTab({ doc }: { doc: Document }) {
  const redactions = doc.analysisResult?.redactions ?? [];

  if (redactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No redactions detected in this document.
      </p>
    );
  }

  // Group by exemption code
  const grouped = useMemo(() => {
    const groups: Record<string, Redaction[]> = {};
    redactions.forEach((r) => {
      if (!groups[r.exemptionCode]) {
        groups[r.exemptionCode] = [];
      }
      groups[r.exemptionCode].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [redactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-heading text-sm">{redactions.length} redaction{redactions.length !== 1 ? "s" : ""} detected</span>
        <span className="text-xs text-muted-foreground">
          grouped by {grouped.length} exemption{grouped.length !== 1 ? "s" : ""}
        </span>
      </div>

      {grouped.map(([code, items]) => (
        <div key={code} className="border border-border bg-surface">
          <div className="px-4 py-3 bg-muted flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {code}
            </Badge>
            <span className="text-sm text-foreground font-medium">
              {items[0].exemptionName}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {items.length} instance{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" size="sm" className="flex-shrink-0 mt-0.5">
                    p.{item.page}
                  </Badge>
                  <p className="text-sm text-foreground">{item.description}</p>
                </div>
                {item.likelyReason && (
                  <div className="ml-[calc(theme(spacing.3)+theme(spacing.2))] pl-3 border-l-2 border-warning/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-warning">Likely reason:</span>{" "}
                      {item.likelyReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Follow-Ups Tab
// ---------------------------------------------------------------------------

function FollowUpsTab({ doc }: { doc: Document }) {
  const followUps = doc.analysisResult?.suggestedFollowUps ?? [];

  if (followUps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No follow-up suggestions for this document.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 p-3">
        <p className="text-sm text-foreground font-medium">
          Based on redactions and findings in this document, you should file these follow-up requests:
        </p>
      </div>

      {followUps.map((suggestion, i) => {
        // Support both string format (legacy) and object format (new)
        const isObject = typeof suggestion === "object" && suggestion !== null;
        const description = isObject ? (suggestion as { description: string }).description : String(suggestion);
        const agency = isObject ? (suggestion as { suggestedAgency?: string }).suggestedAgency : undefined;
        const reasoning = isObject ? (suggestion as { reasoning?: string }).reasoning : undefined;

        // Build URL to pre-fill the request generator
        const requestUrl = `/request?prefill=${encodeURIComponent(description)}${agency ? `&agency=${encodeURIComponent(agency)}` : ""}`;

        return (
          <div
            key={i}
            className="border border-border bg-surface p-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent text-primary">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                >
                  <path d="M2 7H12" />
                  <path d="M7 2V12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-foreground font-medium">{description}</p>
                {agency && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Target agency:</span> {agency}
                  </p>
                )}
                {reasoning && (
                  <p className="text-xs text-muted-foreground italic">
                    {reasoning}
                  </p>
                )}
                <Button variant="primary" size="sm" asChild>
                  <Link href={requestUrl}>
                    Create Follow-Up Request
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patterns Tab
// ---------------------------------------------------------------------------

function PatternsTab({ doc }: { doc: Document }) {
  const patterns = doc.analysisResult?.patterns ?? [];

  if (patterns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No significant patterns detected in this document.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-heading text-sm">Detected Patterns</h4>
      {patterns.map((pattern, i) => (
        <div
          key={i}
          className="border border-border bg-surface p-4 flex items-start gap-3"
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-warning/10 text-warning mt-0.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="7" cy="7" r="6" />
              <line x1="7" y1="4" x2="7" y2="7.5" />
              <circle cx="7" cy="10" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{pattern}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Entities Tab
// ---------------------------------------------------------------------------

function EntitiesTab({ doc }: { doc: Document }) {
  const entities = doc.analysisResult?.entities ?? [];

  if (entities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No key entities extracted from this document.
      </p>
    );
  }

  const sorted = useMemo(
    () => [...entities].sort((a, b) => b.mentions - a.mentions),
    [entities]
  );

  return (
    <div className="space-y-4">
      <h4 className="font-heading text-sm">Key entities extracted</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((entity, i) => (
          <div
            key={i}
            className="border border-border bg-surface p-3 flex items-center justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {entity.name}
              </p>
              <Badge
                variant={getEntityBadgeVariant(entity.type)}
                size="sm"
                className="mt-1"
              >
                {getEntityTypeLabel(entity.type)}
              </Badge>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <span className="text-lg font-heading text-foreground">
                {entity.mentions}
              </span>
              <p className="text-xs text-muted-foreground">mentions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not Found
// ---------------------------------------------------------------------------

function DocumentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="#6B6B6B"
        strokeWidth="1.5"
        strokeLinecap="square"
        className="mb-4"
      >
        <path d="M8 4H28L40 16V44H8V4Z" />
        <line x1="28" y1="4" x2="28" y2="16" />
        <line x1="28" y1="16" x2="40" y2="16" />
        <line x1="18" y1="28" x2="30" y2="28" />
        <path d="M20 24L28 32" />
        <path d="M28 24L20 32" />
      </svg>
      <h2 className="font-heading text-xl text-foreground mb-2">
        Document not found
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        The document you are looking for does not exist or has been removed.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/documents">Back to Documents</Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Detail Page
// ---------------------------------------------------------------------------

export default function DocumentDetailPage() {
  const params = useParams();
  const docId = params.id as string;
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${docId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setDoc(json?.data ?? null))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [docId]);

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">Loading...</div>;
  }

  if (!doc) {
    return <DocumentNotFound />;
  }

  const hasAnalysis =
    doc.analysisStatus === "completed" && doc.analysisResult !== null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/documents"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Documents
        </Link>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground"
        >
          <path d="M4 2L8 6L4 10" />
        </svg>
        <span className="text-foreground font-medium truncate max-w-[300px]">
          {doc.fileName}
        </span>
      </nav>

      {/* Document Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl text-foreground">{doc.fileName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {formatFileSize(doc.fileSize)} &middot; {doc.pageCount}{" "}
            {doc.pageCount === 1 ? "page" : "pages"}
            {doc.requestTitle && (
              <>
                {" "}
                &middot;{" "}
                <span className="text-primary">{doc.requestTitle}</span>
              </>
            )}
          </p>
        </div>
        {hasAnalysis && (
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              Analysis Complete
            </Badge>
            {doc.redactionCount > 0 && (
              <Badge variant="danger" size="sm">
                {doc.redactionCount} Redaction{doc.redactionCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: Document Viewer */}
        <div className="lg:col-span-3">
          <DocumentPreview doc={doc} />
        </div>

        {/* Right panel: Analysis Results */}
        <div className="lg:col-span-2">
          {hasAnalysis ? (
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="redactions">
                  Redactions
                  {doc.redactionCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center bg-danger/10 text-danger text-xs px-1.5">
                      {doc.redactionCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
                <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <SummaryTab doc={doc} />
              </TabsContent>

              <TabsContent value="redactions">
                <RedactionsTab doc={doc} />
              </TabsContent>

              <TabsContent value="entities">
                <EntitiesTab doc={doc} />
              </TabsContent>

              <TabsContent value="patterns">
                <PatternsTab doc={doc} />
              </TabsContent>

              <TabsContent value="followups">
                <FollowUpsTab doc={doc} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border border-border bg-surface p-8 text-center">
              {doc.analysisStatus === "pending" && (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-muted">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B6B6B"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-base text-foreground mb-1">
                    Pending Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This document is queued for AI analysis. Results will appear here once processing is complete.
                  </p>
                </>
              )}
              {doc.analysisStatus === "analyzing" && (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="animate-spin text-warning"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-heading text-base text-foreground mb-1">
                    Analyzing Document
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI analysis is in progress. This typically takes 1-3 minutes depending on document length.
                  </p>
                </>
              )}
              {doc.analysisStatus === "failed" && (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-danger/10">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#CC2222"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="8" x2="16" y2="16" />
                      <line x1="16" y1="8" x2="8" y2="16" />
                    </svg>
                  </div>
                  <h3 className="font-heading text-base text-foreground mb-1">
                    Analysis Failed
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We were unable to analyze this document. The file may be corrupted or in an unsupported format.
                  </p>
                  <Button variant="outline" size="sm">
                    Retry Analysis
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
