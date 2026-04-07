"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getRequest, getDocuments, getActivities } from "@/lib/db";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import {
  getStatusVariant,
  getStatusDisplay,
  relativeTime,
} from "@/lib/request-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Request, Document, Activity, RequestStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status timeline steps
// ---------------------------------------------------------------------------

const TIMELINE_STEPS: { status: RequestStatus; label: string }[] = [
  { status: "draft", label: "Drafted" },
  { status: "filed", label: "Filed" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "processing", label: "Processing" },
  { status: "completed", label: "Completed" },
];

function getTimelineIndex(status: RequestStatus): number {
  if (status === "ready_to_file") return 0;
  if (status === "partial_response") return 4;
  if (status === "denied" || status === "overdue") return -1;
  if (status === "appealed" || status === "appeal_pending") return -1;
  return TIMELINE_STEPS.findIndex((s) => s.status === status);
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M4 2L8 6L4 10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Letter Viewer — matches document preview aesthetic
// ---------------------------------------------------------------------------

function LetterViewer({
  title,
  content,
  agencyName,
}: {
  title: string;
  content: string;
  agencyName: string;
}) {
  return (
    <div className="border border-border bg-white flex flex-col">
      {/* Viewer header */}
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
          <span className="text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        <Badge variant="outline" size="sm">
          {agencyName}
        </Badge>
      </div>

      {/* Letter content */}
      <div className="p-8 bg-[#F8F8F6]">
        <div className="max-w-[640px] mx-auto bg-white border border-border p-8 sm:p-10">
          <pre className="text-sm font-document leading-relaxed text-foreground whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Timeline
// ---------------------------------------------------------------------------

function StatusTimeline({ status }: { status: RequestStatus }) {
  const currentIndex = getTimelineIndex(status);
  const isTerminal = status === "denied" || status === "overdue";
  const isAppeal = status === "appealed" || status === "appeal_pending";

  return (
    <div className="border border-border bg-surface p-6">
      <h3 className="font-heading text-sm text-foreground mb-5 uppercase tracking-wider">
        Progress
      </h3>

      {(isTerminal || isAppeal) ? (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center flex-shrink-0",
            isTerminal ? "bg-danger/10" : "bg-secondary/10",
          )}>
            {isTerminal ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-danger">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary">
                <path d="M8 3V13M3 8H13" />
              </svg>
            )}
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              isTerminal ? "text-danger" : "text-secondary",
            )}>
              {getStatusDisplay(status)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isTerminal
                ? "This request has been denied or is overdue."
                : "An appeal has been submitted for this request."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {TIMELINE_STEPS.map((step, i) => {
            const reached = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={step.status} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-3 h-3 flex-shrink-0 transition-colors",
                      reached ? "bg-primary" : "bg-muted",
                      isCurrent && "ring-2 ring-primary/20 ring-offset-1 ring-offset-surface",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wider whitespace-nowrap",
                      reached ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-1 mt-[-18px]",
                      i < currentIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Row — for the metadata panel
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground text-right">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Item
// ---------------------------------------------------------------------------

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-1.5 h-1.5 bg-primary mt-2 flex-shrink-0" />
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-sm text-foreground">
          {activity.description || activity.action}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {relativeTime(activity.createdAt || activity.timestamp || "")}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not Found
// ---------------------------------------------------------------------------

function RequestNotFound() {
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
        Request not found
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        The request you are looking for does not exist or has been removed.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/tracker">Back to Tracker</Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 bg-muted w-16 animate-pulse" />
        <div className="h-4 bg-muted w-4 animate-pulse" />
        <div className="h-4 bg-muted w-32 animate-pulse" />
      </div>

      {/* Header */}
      <div>
        <div className="h-8 bg-muted w-2/3 animate-pulse mb-3" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted w-20 animate-pulse" />
          <div className="h-5 bg-muted w-28 animate-pulse" />
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-border bg-surface p-6 animate-pulse">
        <div className="h-3 bg-muted w-16 mb-5" />
        <div className="flex items-center gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-3 h-3 bg-muted" />
                <div className="h-2 bg-muted w-12" />
              </div>
              {i < 4 && <div className="flex-1 h-px bg-muted mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 border border-border bg-surface p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-muted w-full" />
          <div className="h-4 bg-muted w-5/6" />
          <div className="h-4 bg-muted w-4/6" />
          <div className="h-4 bg-muted w-full" />
          <div className="h-4 bg-muted w-3/4" />
        </div>
        <div className="lg:col-span-2 border border-border bg-surface p-6 space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-muted w-16" />
              <div className="h-3 bg-muted w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Detail Page
// ---------------------------------------------------------------------------

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [request, setRequest] = useState<Request | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getRequest(id),
      getDocuments(),
      getActivities(50),
    ]).then(([req, docs, acts]) => {
      setRequest(req);
      setDocuments(docs.filter((d) => d.requestId === id));
      setActivities(acts.filter((a) => a.requestId === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!request) return <RequestNotFound />;

  const daysLeft = request.dueDate ? daysFromNow(request.dueDate) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const hasLetter = !!request.generatedLetter;
  const hasAppeal = !!request.appealLetter;
  const qualityProgress = request.qualityScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/tracker"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Tracker
        </Link>
        <ChevronIcon className="text-muted-foreground" />
        <span className="text-foreground font-medium truncate max-w-[400px]">
          {request.title}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground">
            {request.title}
          </h1>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge variant={getStatusVariant(request.status)} size="sm">
              {getStatusDisplay(request.status)}
            </Badge>
            <span className="inline-block border border-border px-2 py-0.5 text-[11px] font-medium text-primary">
              {request.agencyName}
            </span>
            {request.qualityScore !== null && (
              <span className="inline-flex items-center bg-success/10 text-success border border-success/20 px-1.5 py-0.5 text-[11px] font-medium">
                {request.qualityScore}%
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center bg-danger/10 text-danger border border-danger/20 px-1.5 py-0.5 text-[11px] font-medium">
                {Math.abs(daysLeft!)}d overdue
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {request.status === "draft" && (
            <Link href={`/request?edit=${id}`}>
              <Button variant="outline" size="sm">
                Edit Draft
              </Button>
            </Link>
          )}
          {documents.length > 0 && (
            <Link href={`/documents/${documents[0].id}`}>
              <Button variant="outline" size="sm">
                View Documents
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline status={request.status} />

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — Letters & Description */}
        <div className="lg:col-span-3 space-y-6">
          {(hasLetter || hasAppeal) ? (
            <Tabs defaultValue={hasLetter ? "letter" : "appeal"}>
              <TabsList>
                {hasLetter && (
                  <TabsTrigger value="letter">FOIA Letter</TabsTrigger>
                )}
                {hasAppeal && (
                  <TabsTrigger value="appeal">Appeal Letter</TabsTrigger>
                )}
                <TabsTrigger value="description">Description</TabsTrigger>
              </TabsList>

              {hasLetter && (
                <TabsContent value="letter">
                  <LetterViewer
                    title="FOIA Request Letter"
                    content={request.generatedLetter!}
                    agencyName={request.agencyName}
                  />
                </TabsContent>
              )}

              {hasAppeal && (
                <TabsContent value="appeal">
                  <LetterViewer
                    title="Appeal Letter"
                    content={request.appealLetter!}
                    agencyName={request.agencyName}
                  />
                </TabsContent>
              )}

              <TabsContent value="description">
                <div className="border border-border bg-surface p-6">
                  <p className="text-sm font-document leading-relaxed text-foreground whitespace-pre-wrap">
                    {request.description || "No description provided."}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border border-border bg-surface p-6">
              <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Description
              </h3>
              <p className="text-sm font-document leading-relaxed text-foreground whitespace-pre-wrap">
                {request.description || "No description provided."}
              </p>
            </div>
          )}

          {/* Related Documents */}
          {documents.length > 0 && (
            <div className="border border-border bg-surface">
              <div className="px-4 py-3 border-b border-border bg-muted flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Documents
                </span>
                <span className="text-xs text-muted-foreground">
                  {documents.length} file{documents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/[0.02] transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      className="text-muted-foreground flex-shrink-0"
                    >
                      <path d="M3 1H9L13 5V15H3V1Z" />
                      <line x1="9" y1="1" x2="9" y2="5" />
                      <line x1="9" y1="5" x2="13" y2="5" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
                        {doc.analysisStatus === "completed" && (
                          <> &middot; <span className="text-success">Analyzed</span></>
                        )}
                      </p>
                    </div>
                    {doc.redactionCount > 0 && (
                      <Badge variant="danger" size="sm">
                        {doc.redactionCount} redaction{doc.redactionCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — Metadata & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="border border-border bg-surface p-6">
            <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Details
            </h3>
            <dl>
              <DetailRow label="Agency">
                <span className="font-medium">{request.agencyName}</span>
              </DetailRow>
              <DetailRow label="Filed">
                {request.filedAt ? formatDate(request.filedAt) : (
                  <span className="text-muted-foreground">Not yet filed</span>
                )}
              </DetailRow>
              <DetailRow label="Due Date">
                <span className={cn(isOverdue && "text-danger font-medium")}>
                  {request.dueDate ? formatDate(request.dueDate) : (
                    <span className="text-muted-foreground">No deadline</span>
                  )}
                  {daysLeft !== null && !isOverdue && (
                    <span className={cn(
                      "ml-1.5 text-xs",
                      daysLeft <= 10 ? "text-warning" : "text-muted-foreground",
                    )}>
                      ({daysLeft}d)
                    </span>
                  )}
                </span>
              </DetailRow>
              <DetailRow label="Response">
                {request.respondedAt ? formatDate(request.respondedAt) : (
                  <span className="text-muted-foreground">Awaiting</span>
                )}
              </DetailRow>
              <DetailRow label="Created">
                {formatDate(request.createdAt)}
              </DetailRow>
            </dl>
          </div>

          {/* Quality score */}
          {request.qualityScore !== null && (
            <div className="border border-border bg-surface p-6">
              <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Quality Score
              </h3>
              <div className="flex items-end gap-3 mb-3">
                <span className="font-heading text-3xl text-foreground">
                  {request.qualityScore}%
                </span>
                <span className="text-xs text-muted-foreground pb-1">
                  {request.qualityScore >= 80
                    ? "Strong request"
                    : request.qualityScore >= 60
                    ? "Good request"
                    : "Needs improvement"}
                </span>
              </div>
              <Progress value={qualityProgress} className="h-1.5" />
            </div>
          )}

          {/* Activity feed */}
          {activities.length > 0 && (
            <div className="border border-border bg-surface p-6">
              <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Activity
              </h3>
              <div>
                {activities.slice(0, 8).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
                {activities.length > 8 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{activities.length - 8} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
