"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Agency, Request } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Stars({ rating, large }: { rating: number; large?: boolean }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("filled");
    else if (i === full && hasHalf) stars.push("half");
    else stars.push("empty");
  }
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", large && "text-2xl")}
      aria-label={`${rating} out of 5`}
    >
      {stars.map((s, i) => (
        <span key={i} className={s === "empty" ? "text-border" : "text-primary"}>
          {s === "empty" ? "\u2606" : "\u2605"}
        </span>
      ))}
    </span>
  );
}

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusVariant(
  status: Request["status"]
): "default" | "primary" | "success" | "warning" | "danger" | "outline" {
  switch (status) {
    case "draft":
      return "default";
    case "ready_to_file":
      return "outline";
    case "filed":
    case "acknowledged":
      return "primary";
    case "processing":
      return "warning";
    case "partial_response":
      return "warning";
    case "completed":
      return "success";
    case "denied":
      return "danger";
    case "appealed":
    case "appeal_pending":
      return "danger";
    case "overdue":
      return "danger";
    default:
      return "default";
  }
}

function statusLabel(status: Request["status"]): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border last:border-b-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyRequests, setAgencyRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/agencies/${id}`).then((r) => r.json()),
      fetch(`/api/requests?agencyId=${id}&limit=50`).then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([agencyRes, requestsRes]) => {
        setAgency(agencyRes.data ?? null);
        setAgencyRequests(requestsRes.data ?? []);
      })
      .catch(() => setAgency(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-16 text-center text-muted-foreground">Loading...</div>;
  }

  if (!agency) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="font-heading text-3xl text-foreground mb-2">Agency not found</h1>
        <p className="text-muted-foreground mb-6">
          The agency you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" asChild>
          <Link href="/agencies">Back to All Agencies</Link>
        </Button>
      </div>
    );
  }

  const responsePercent = Math.min(
    (agency.averageResponseDays / 120) * 100,
    100
  );
  const FEDERAL_AVG = 45;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/agencies">
            <span aria-hidden="true">&larr;</span> All Agencies
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-3xl text-foreground">
                {agency.name}
              </h1>
              <Badge variant="primary">{agency.abbreviation}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" size="sm">
                {agency.level.charAt(0).toUpperCase() + agency.level.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {agency.jurisdiction}
              </span>
              <span className="text-sm text-muted-foreground">&middot;</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {formatCategory(agency.category)}
              </span>
            </div>
          </div>

          <Button variant="primary" size="lg" asChild className="shrink-0">
            <Link href={`/request/new?agency=${agency.id}`}>Start a Request</Link>
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section>
            <h2 className="font-heading text-xl text-foreground mb-3">About</h2>
            <p className="font-body text-foreground leading-relaxed">
              {agency.description}
            </p>
          </section>

          {/* FOIA Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FOIA Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {agency.foiaOfficer && (
                  <InfoRow label="FOIA Officer">{agency.foiaOfficer}</InfoRow>
                )}
                <InfoRow label="Email">
                  <a
                    href={`mailto:${agency.foiaEmail}`}
                    className="text-primary hover:underline"
                  >
                    {agency.foiaEmail}
                  </a>
                </InfoRow>
                {agency.foiaPhone && (
                  <InfoRow label="Phone">{agency.foiaPhone}</InfoRow>
                )}
                <InfoRow label="Online Portal">
                  <a
                    href={agency.foiaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {agency.foiaUrl}
                  </a>
                </InfoRow>
                <InfoRow label="Mailing Address">{agency.mailingAddress}</InfoRow>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Performance card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Compliance Rating */}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                  Compliance Rating
                </p>
                <div className="flex items-center gap-3">
                  <Stars rating={agency.complianceRating} large />
                  <span className="font-heading text-lg">
                    {agency.complianceRating.toFixed(1)}{" "}
                    <span className="text-sm text-muted-foreground font-body">
                      / 5.0
                    </span>
                  </span>
                </div>
              </div>

              {/* Average Response Time */}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                  Average Response Time
                </p>
                <p className="font-heading text-3xl text-foreground">
                  {agency.averageResponseDays}{" "}
                  <span className="text-base text-muted-foreground font-body">
                    days
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Federal average: {FEDERAL_AVG} days
                </p>
                <div className="mt-2">
                  <Progress value={responsePercent} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Total Public Requests Filed
                </p>
                <p className="font-heading text-2xl">
                  {agency.requestCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Typical Response
                </p>
                <p className="text-sm text-foreground">
                  Within {agency.averageResponseDays} days
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Common Exemptions Used
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant="outline" size="sm">b(6)</Badge>
                  <Badge variant="outline" size="sm">b(7)(C)</Badge>
                  <Badge variant="outline" size="sm">b(5)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Requests Section */}
      <section>
        <h2 className="font-heading text-xl text-foreground mb-4">
          Recent FOIA Requests to {agency.name}
        </h2>

        {agencyRequests.length === 0 ? (
          <div className="border border-border bg-surface p-8 text-center">
            <p className="text-muted-foreground">No requests filed yet.</p>
            <Button variant="primary" size="sm" asChild className="mt-3">
              <Link href={`/request/new?agency=${agency.id}`}>Start one?</Link>
            </Button>
          </div>
        ) : (
          <div className="border border-border bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    Filed Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {agencyRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">
                      {req.title}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant(req.status)} size="sm">
                        {statusLabel(req.status)}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {req.filedAt ? formatDate(req.filedAt) : "Not filed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
