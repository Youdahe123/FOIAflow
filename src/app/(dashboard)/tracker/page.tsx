"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getRequests, updateRequest, logActivity } from "@/lib/db";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import { getStatusVariant, getStatusDisplay } from "@/lib/request-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Request, RequestStatus } from "@/types";

const ALL_STATUSES: RequestStatus[] = [
  "draft", "ready_to_file", "filed", "acknowledged", "processing",
  "partial_response", "completed", "denied", "overdue", "appealed", "appeal_pending",
];

const INDUSTRY_CATEGORIES = [
  "Government & Administration", "Law Enforcement & Justice", "Health & Human Services",
  "Education", "Finance & Commerce", "Transportation & Infrastructure",
  "Environment & Natural Resources", "Labor & Employment", "Housing & Community",
  "Agriculture & Food", "Public Safety & Defense", "Science & Technology",
  "Arts & Culture", "Regulatory & Licensing", "Social Services"
] as const;

const LEVELS = ["Federal", "State", "County", "City", "Special District"] as const;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
] as const;

interface SnowdenAgency {
  id: string;
  name: string;
  level: typeof LEVELS[number];
  state: string;
  industry: typeof INDUSTRY_CATEGORIES[number];
  governing_law: string;
  law_citation: string;
  deadline_days: number;
  website?: string;
  email?: string;
}
    id: "responded",
    label: "Responded",
    statuses: ["partial_response", "completed"],
    accent: "border-t-success",
    dotColor: "bg-success",
  },
  {
    id: "needs_action",
    label: "Needs Action",
    statuses: ["denied", "overdue", "appealed", "appeal_pending"],
    accent: "border-t-danger",
    dotColor: "bg-danger",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUrgencyBorder(request: Request): string {
  if (request.status === "denied" || request.status === "overdue") {
    return "border-l-danger";
  }
  if (!request.dueDate) return "border-l-transparent";
  const days = daysFromNow(request.dueDate);
  if (days < 0) return "border-l-danger";
  if (days <= 10) return "border-l-warning";
  return "border-l-transparent";
}

function getDueDateColor(request: Request): string {
  if (!request.dueDate) return "text-muted-foreground";
  const days = daysFromNow(request.dueDate);
  if (days < 0) return "text-danger font-medium";
  if (days <= 10) return "text-warning font-medium";
  return "text-muted-foreground";
}

function getUniqueAgencies(requests: Request[]): string[] {
  const agencies = new Set(requests.map((r) => r.agencyName));
  return Array.from(agencies).sort();
}

// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------

type SortKey = "title" | "agency" | "status" | "quality" | "filed" | "due" | "days";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M3 5L6 8L9 5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stat Card — matches landing page metric style
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="border border-border bg-surface p-4 flex-1 min-w-[140px]">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className={cn("font-heading text-2xl", accent || "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Card — polished editorial style
// ---------------------------------------------------------------------------

function KanbanCard({
  request,
  onStatusChange,
}: {
  request: Request;
  onStatusChange: (id: string, status: RequestStatus) => void;
}) {
  const urgencyBorder = getUrgencyBorder(request);
  const dueDateColor = getDueDateColor(request);
  const daysLeft = request.dueDate ? daysFromNow(request.dueDate) : null;

  return (
    <div
      className={cn(
        "border border-border bg-surface p-4 mb-3 border-l-[3px] hover-lift",
        urgencyBorder
      )}
    >
      <p className="font-heading text-sm text-foreground line-clamp-2 mb-3">
        {request.title}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block border border-border px-2 py-0.5 text-[11px] font-medium text-primary truncate max-w-[180px]">
          {request.agencyName}
        </span>
        {request.qualityScore !== null && (
          <span className="inline-flex items-center bg-success/10 text-success border border-success/20 px-1.5 py-0.5 text-[11px] font-medium">
            {request.qualityScore}%
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-muted-foreground">
          {request.filedAt ? formatDate(request.filedAt) : "Not filed"}
        </span>
        {request.dueDate && (
          <span className={dueDateColor}>
            {daysLeft !== null && daysLeft < 0
              ? `${Math.abs(daysLeft)}d overdue`
              : daysLeft !== null
              ? `${daysLeft}d left`
              : ""}
          </span>
        )}
      </div>

      {/* Status dropdown */}
      <div className="relative">
        <select
          value={request.status}
          onChange={(e) =>
            onStatusChange(request.id, e.target.value as RequestStatus)
          }
          className="w-full h-7 appearance-none border border-border bg-background px-2 pr-6 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {getStatusDisplay(s)}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="border border-border bg-surface p-4 mb-3 border-l-[3px] border-l-muted animate-pulse">
      <div className="h-4 bg-muted w-3/4 mb-3" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 bg-muted w-24" />
        <div className="h-5 bg-muted w-10" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-muted w-16" />
        <div className="h-3 bg-muted w-12" />
      </div>
      <div className="h-7 bg-muted w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function KanbanColumnComponent({
  column,
  requests,
  loading,
  onStatusChange,
}: {
  column: KanbanColumn;
  requests: Request[];
  loading?: boolean;
  onStatusChange: (id: string, status: RequestStatus) => void;
}) {
  return (
    <div className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col">
      {/* Column header with colored top border */}
      <div className={cn("border border-border bg-surface border-t-2 px-4 py-3 flex items-center justify-between", column.accent)}>
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", column.dotColor)} />
          <span className="font-heading text-sm text-foreground">{column.label}</span>
        </div>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 border border-border text-[11px] font-medium text-muted-foreground">
          {loading ? "-" : requests.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pt-3 pr-1">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : requests.length === 0 ? (
          <div className="border border-dashed border-border p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              No requests
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <KanbanCard
              key={req.id}
              request={req}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort Header
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
        isActive && "text-foreground",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive && (
        <ChevronDownIcon
          className={cn("transition-transform", currentDir === "desc" && "rotate-180")}
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// List View
// ---------------------------------------------------------------------------

function ListView({
  requests,
  sortKey,
  sortDir,
  onSort,
}: {
  requests: Request[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    const arr = [...requests];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "agency":
          cmp = a.agencyName.localeCompare(b.agencyName);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "quality":
          cmp = (a.qualityScore ?? 0) - (b.qualityScore ?? 0);
          break;
        case "filed":
          cmp =
            new Date(a.filedAt ?? "1970-01-01").getTime() -
            new Date(b.filedAt ?? "1970-01-01").getTime();
          break;
        case "due":
          cmp =
            new Date(a.dueDate ?? "2099-12-31").getTime() -
            new Date(b.dueDate ?? "2099-12-31").getTime();
          break;
        case "days": {
          const dA = a.dueDate ? daysFromNow(a.dueDate) : 9999;
          const dB = b.dueDate ? daysFromNow(b.dueDate) : 9999;
          cmp = dA - dB;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [requests, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-3 pr-4">
              <SortHeader label="Title" sortKey="title" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3 pr-4">
              <SortHeader label="Agency" sortKey="agency" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3 pr-4">
              <SortHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3 pr-4">
              <SortHeader label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3 pr-4">
              <SortHeader label="Filed" sortKey="filed" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3 pr-4">
              <SortHeader label="Due" sortKey="due" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
            <th className="text-left py-3">
              <SortHeader label="Days Left" sortKey="days" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((req) => {
            const daysLeft = req.dueDate ? daysFromNow(req.dueDate) : null;
            return (
              <tr
                key={req.id}
                className="border-b border-border hover:bg-primary/[0.02] transition-colors"
              >
                <td className="py-3.5 pr-4 font-medium max-w-[300px]">
                  <span className="line-clamp-1">{req.title}</span>
                </td>
                <td className="py-3.5 pr-4 max-w-[200px]">
                  <span className="inline-block border border-border px-2 py-0.5 text-[11px] font-medium text-primary truncate max-w-full">
                    {req.agencyName}
                  </span>
                </td>
                <td className="py-3.5 pr-4">
                  <Badge variant={getStatusVariant(req.status)} size="sm">
                    {getStatusDisplay(req.status)}
                  </Badge>
                </td>
                <td className="py-3.5 pr-4 text-muted-foreground">
                  {req.qualityScore !== null ? (
                    <span className="inline-flex items-center bg-success/10 text-success border border-success/20 px-1.5 py-0.5 text-[11px] font-medium">
                      {req.qualityScore}%
                    </span>
                  ) : (
                    "\u2014"
                  )}
                </td>
                <td className="py-3.5 pr-4 text-muted-foreground text-xs">
                  {req.filedAt ? formatDate(req.filedAt) : "\u2014"}
                </td>
                <td className="py-3.5 pr-4 text-muted-foreground text-xs">
                  {req.dueDate ? formatDate(req.dueDate) : "\u2014"}
                </td>
                <td className={cn("py-3.5 text-xs", getDueDateColor(req))}>
                  {daysLeft !== null
                    ? daysLeft < 0
                      ? `${Math.abs(daysLeft)}d overdue`
                      : `${daysLeft}d`
                    : "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Tracker Page
// ---------------------------------------------------------------------------

export default function TrackerPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "list">("board");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    getRequests().then((reqs) => {
      setRequests(reqs);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: RequestStatus) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      const updated = await updateRequest(id, { status: newStatus });
      if (!updated) {
        const reqs = await getRequests();
        setRequests(reqs);
        return;
      }

      await logActivity(
        "updated_status",
        `Changed request status to ${getStatusDisplay(newStatus)}`,
        id
      );
    },
    []
  );

  const agencies = useMemo(() => getUniqueAgencies(requests), [requests]);

  const filtered = useMemo(() => {
    let result = [...requests];
    if (agencyFilter !== "all") {
      result = result.filter((r) => r.agencyName === agencyFilter);
    }
    if (statusFilter !== "all") {
      const col = COLUMNS.find((c) => c.id === statusFilter);
      if (col) {
        result = result.filter((r) => col.statuses.includes(r.status));
      }
    }
    return result;
  }, [requests, agencyFilter, statusFilter]);

  const columnData = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      requests: filtered.filter((r) => col.statuses.includes(r.status)),
    }));
  }, [filtered]);

  // Summary stats
  const stats = useMemo(() => {
    const overdueCount = requests.filter(
      (r) => r.status === "overdue" || (r.dueDate && daysFromNow(r.dueDate) < 0 && !["completed", "denied", "draft"].includes(r.status))
    ).length;

    const responded = requests.filter((r) => r.filedAt && r.respondedAt);
    let avgDays = 0;
    if (responded.length > 0) {
      const totalDays = responded.reduce((sum, r) => {
        const filed = new Date(r.filedAt!).getTime();
        const resp = new Date(r.respondedAt!).getTime();
        return sum + (resp - filed) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDays = Math.round(totalDays / responded.length);
    }

    const pendingCount = requests.filter((r) =>
      ["filed", "acknowledged", "processing"].includes(r.status)
    ).length;

    return { total: requests.length, overdue: overdueCount, avgDays, pending: pendingCount };
  }, [requests]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl text-foreground mb-1">
              Request Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor deadlines, track statuses, and manage your FOIA pipeline.
            </p>
          </div>
          <Link href="/request">
            <Button variant="primary" size="sm">
              New Request
              <svg className="ml-1.5 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Summary stats — editorial metric cards */}
        <div className="flex flex-wrap gap-3">
          <StatCard label="Total Requests" value={loading ? "-" : stats.total} />
          <StatCard label="Pending" value={loading ? "-" : stats.pending} accent="text-primary" />
          <StatCard
            label="Overdue"
            value={loading ? "-" : stats.overdue}
            accent={stats.overdue > 0 ? "text-danger" : "text-foreground"}
          />
          <StatCard
            label="Avg Response"
            value={loading ? "-" : `${stats.avgDays}d`}
            accent="text-foreground"
          />
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* View toggle — tab style like landing page interactive steps */}
        <div className="flex border-b-0">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all duration-300 border-b-2",
                view === v
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="h-8 appearance-none border border-border bg-surface px-3 pr-7 text-xs font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Agencies</option>
              {agencies.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 appearance-none border border-border bg-surface px-3 pr-7 text-xs font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Statuses</option>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {!loading && requests.length === 0 ? (
        <div className="border border-border bg-surface p-16 text-center">
          <div className="text-primary mb-4">
            <svg className="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="18" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 className="font-heading text-xl text-foreground mb-2">
            No requests yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first FOIA request to start tracking deadlines, statuses, and agency responses.
          </p>
          <Link href="/request">
            <Button variant="primary">
              Create Request
              <svg className="ml-1.5 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Board View */}
          {view === "board" && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columnData.map((col) => (
                <KanbanColumnComponent
                  key={col.id}
                  column={col}
                  requests={col.requests}
                  loading={loading}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}

          {/* List View */}
          {view === "list" && (
            <div className="border border-border bg-surface">
              <div className="p-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="h-4 bg-muted w-1/3" />
                        <div className="h-4 bg-muted w-1/5" />
                        <div className="h-4 bg-muted w-16" />
                        <div className="h-4 bg-muted w-10" />
                        <div className="h-4 bg-muted w-20" />
                        <div className="h-4 bg-muted w-20" />
                        <div className="h-4 bg-muted w-12" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ListView
                    requests={filtered}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Analytics — always visible, pipeline bar ─────────────── */}
          <div className="border border-border bg-surface p-6">
            <h3 className="font-heading text-lg text-foreground mb-4">Pipeline</h3>

            {/* Status distribution bar */}
            <div className="mb-6">
              <div className="flex h-3 w-full overflow-hidden bg-muted">
                {columnData.map((col) => {
                  const pct = filtered.length > 0 ? (col.requests.length / filtered.length) * 100 : 0;
                  if (pct === 0) return null;
                  const colorMap: Record<string, string> = {
                    drafts: "bg-muted-foreground",
                    filed: "bg-primary",
                    in_progress: "bg-warning",
                    responded: "bg-success",
                    needs_action: "bg-danger",
                  };
                  return (
                    <div
                      key={col.id}
                      className={cn("h-full transition-all duration-500", colorMap[col.id])}
                      style={{ width: `${pct}%` }}
                      title={`${col.label}: ${col.requests.length}`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                {columnData.map((col) => (
                  <div key={col.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                    <span>{col.label}</span>
                    <span className="font-medium text-foreground">{col.requests.length}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top agencies */}
            {agencies.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Top Agencies
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(() => {
                    const counts: Record<string, number> = {};
                    filtered.forEach((r) => {
                      counts[r.agencyName] = (counts[r.agencyName] || 0) + 1;
                    });
                    return Object.entries(counts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([name, count], i) => (
                        <div key={name} className="flex items-start gap-3 p-3 border border-border bg-background">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-border text-xs font-heading text-primary">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {count} {count === 1 ? "request" : "requests"}
                            </p>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
