"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Agency, AgencyLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVELS: { label: string; value: AgencyLevel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Federal", value: "federal" },
  { label: "State", value: "state" },
  { label: "Local", value: "local" },
];

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Law Enforcement", value: "law_enforcement" },
  { label: "Health", value: "health" },
  { label: "Defense", value: "defense" },
  { label: "Environment", value: "environment" },
  { label: "Financial", value: "finance" },
  { label: "Intelligence", value: "intelligence" },
  { label: "Homeland Security", value: "homeland_security" },
  { label: "Regulatory", value: "regulatory" },
  { label: "Science", value: "science" },
  { label: "Transportation", value: "transportation" },
];

const MAX_COMPARE = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("filled");
    else if (i === full && hasHalf) stars.push("half");
    else stars.push("empty");
  }
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {stars.map((s, i) => (
        <span key={i} className={s === "empty" ? "text-border" : "text-primary"}>
          {s === "empty" ? "\u2606" : "\u2605"}
        </span>
      ))}
    </span>
  );
}

function responseColor(days: number): string {
  if (days <= 30) return "bg-success";
  if (days <= 60) return "bg-warning";
  return "bg-danger";
}

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Search Icon (inline SVG)
// ---------------------------------------------------------------------------

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// AgencyCard
// ---------------------------------------------------------------------------

function AgencyCard({
  agency,
  compareMode,
  isSelected,
  onToggleCompare,
}: {
  agency: Agency;
  compareMode: boolean;
  isSelected: boolean;
  onToggleCompare: (id: string) => void;
}) {
  const responsePercent = Math.min((agency.averageResponseDays / 120) * 100, 100);

  return (
    <div className="border border-border bg-surface p-0 flex flex-col">
      {/* Top section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-lg leading-tight">{agency.name}</h3>
            <Badge variant="primary" size="sm">
              {agency.abbreviation}
            </Badge>
          </div>
          {compareMode && (
            <button
              type="button"
              onClick={() => onToggleCompare(agency.id)}
              className={cn(
                "shrink-0 h-5 w-5 border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary text-white"
                  : "border-border bg-surface"
              )}
              aria-label={isSelected ? "Deselect for comparison" : "Select for comparison"}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" size="sm">
            {agency.level.charAt(0).toUpperCase() + agency.level.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground">{agency.jurisdiction}</span>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-2">
          {formatCategory(agency.category)}
        </p>
      </div>

      {/* Middle section */}
      <div className="p-5 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <Stars rating={agency.complianceRating} />
          <span className="text-sm text-muted-foreground">
            {agency.complianceRating.toFixed(1)}
          </span>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {agency.averageResponseDays} days avg. response
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted overflow-hidden">
            <div
              className={cn("h-full transition-[width] duration-300", responseColor(agency.averageResponseDays))}
              style={{ width: `${responsePercent}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {agency.requestCount.toLocaleString()} public requests filed
        </p>
      </div>

      {/* Bottom section */}
      <div className="p-5 border-t border-border flex gap-2 mt-auto">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/agencies/${agency.id}`}>View Details</Link>
        </Button>
        <Button variant="primary" size="sm" asChild className="flex-1">
          <Link href={`/request/new?agency=${agency.id}`}>Start Request</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparisonView
// ---------------------------------------------------------------------------

function ComparisonView({
  agencies,
  onClose,
}: {
  agencies: Agency[];
  onClose: () => void;
}) {
  const bestResponse = Math.min(...agencies.map((a) => a.averageResponseDays));
  const bestCompliance = Math.max(...agencies.map((a) => a.complianceRating));

  const rows: {
    label: string;
    getValue: (a: Agency) => string;
    isBest?: (a: Agency) => boolean;
  }[] = [
    { label: "Name", getValue: (a) => a.name },
    { label: "Level", getValue: (a) => a.level.charAt(0).toUpperCase() + a.level.slice(1) },
    {
      label: "Avg Response Time",
      getValue: (a) => `${a.averageResponseDays} days`,
      isBest: (a) => a.averageResponseDays === bestResponse,
    },
    {
      label: "Compliance Rating",
      getValue: (a) => `${a.complianceRating.toFixed(1)} / 5.0`,
      isBest: (a) => a.complianceRating === bestCompliance,
    },
    { label: "FOIA Email", getValue: (a) => a.foiaEmail },
    {
      label: "Contact Method",
      getValue: (a) => {
        const methods: string[] = [];
        if (a.foiaEmail) methods.push("Email");
        if (a.foiaUrl) methods.push("Online Portal");
        if (a.foiaPhone) methods.push("Phone");
        if (a.mailingAddress) methods.push("Mail");
        return methods.join(", ");
      },
    },
    { label: "Category", getValue: (a) => formatCategory(a.category) },
    { label: "Total Requests", getValue: (a) => a.requestCount.toLocaleString() },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-2xl">Agency Comparison</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close Comparison
        </Button>
      </div>
      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground w-44">
                Metric
              </th>
              {agencies.map((a) => (
                <th key={a.id} className="text-left p-4 font-heading text-base">
                  {a.abbreviation}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-b-0">
                <td className="p-4 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {row.label}
                </td>
                {agencies.map((a) => (
                  <td
                    key={a.id}
                    className={cn(
                      "p-4",
                      row.isBest?.(a) && "text-success font-medium"
                    )}
                  >
                    {row.getValue(a)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<AgencyLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetch("/api/agencies?limit=200")
      .then((res) => res.json())
      .then((json) => setAgencies(json.data ?? []))
      .catch(() => setAgencies([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    return agencies.filter((a) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          a.name.toLowerCase().includes(q) ||
          a.abbreviation.toLowerCase().includes(q) ||
          formatCategory(a.category).toLowerCase().includes(q) ||
          a.jurisdiction.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Level
      if (levelFilter !== "all" && a.level !== levelFilter) return false;
      // Category
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      return true;
    });
  }, [search, levelFilter, categoryFilter, agencies]);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setCompareIds([]);
    setShowComparison(false);
  }

  const comparedAgencies = agencies.filter((a) => compareIds.includes(a.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-3xl text-foreground">Agency Finder</h1>
        <p className="text-muted-foreground mt-1">
          Search and explore government agencies to find the right FOIA contact.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agencies by name, category, or jurisdiction..."
          className="h-12 w-full border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filters row */}
      <div className="space-y-3">
        {/* Level filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium mr-1">
            Level:
          </span>
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevelFilter(l.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors border",
                levelFilter === l.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-foreground border-border hover:border-primary/50"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoryFilter(c.value)}
              className={cn(
                "px-3 py-1 text-sm transition-colors border shrink-0",
                categoryFilter === c.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-primary/50"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar: results count + compare toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {agencies.length} agencies
        </p>
        <div className="flex items-center gap-2">
          {compareMode && compareIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowComparison(true)}
              disabled={compareIds.length < 2}
            >
              Compare Selected ({compareIds.length})
            </Button>
          )}
          <Button
            variant={compareMode ? "primary" : "outline"}
            size="sm"
            onClick={() => (compareMode ? exitCompareMode() : setCompareMode(true))}
          >
            {compareMode ? "Exit Compare" : "Compare"}
          </Button>
        </div>
      </div>

      {/* Comparison view */}
      {showComparison && comparedAgencies.length >= 2 && (
        <ComparisonView
          agencies={comparedAgencies}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Agency grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading agencies...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agency) => (
          <AgencyCard
            key={agency.id}
            agency={agency}
            compareMode={compareMode}
            isSelected={compareIds.includes(agency.id)}
            onToggleCompare={toggleCompare}
          />
        ))}
      </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No agencies match your search.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try broadening your search or adjusting filters.
          </p>
        </div>
      )}

      {/* Sticky comparison bar */}
      {compareMode && compareIds.length > 0 && !showComparison && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {compareIds.length} of {MAX_COMPARE} selected
              </span>
              <div className="flex items-center gap-2">
                {comparedAgencies.map((a) => (
                  <Badge key={a.id} variant="primary" size="sm">
                    {a.abbreviation}
                    <button
                      type="button"
                      className="ml-1 hover:opacity-70"
                      onClick={() => toggleCompare(a.id)}
                      aria-label={`Remove ${a.abbreviation}`}
                    >
                      x
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowComparison(true)}
              disabled={compareIds.length < 2}
            >
              Compare Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
