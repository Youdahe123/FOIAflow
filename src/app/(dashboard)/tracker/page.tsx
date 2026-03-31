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
  "draft",
  "ready_to_file",
  "filed",
  "acknowledged",
  "processing",
  "partial_response",
  "completed",
  "denied",
  "overdue",
  "appealed",
  "appeal_pending",
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface KanbanColumn {
  id: string;
  label: string;
  statuses: RequestStatus[];
  headerBg: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: "drafts",
    label: "Drafts",
    statuses: ["draft", "ready_to_file"],
    headerBg: "bg-muted",
  },
  {
    id: "filed",
    label: "Filed",
    statuses: ["filed", "acknowledged"],
    headerBg: "bg-primary/10",
  },
  {
    id: "in_progress",
    label: "In Progress",
    statuses: ["processing"],
    headerBg: "bg-warning/10",
  },
  {
    id: "responded",
    label: "Responded",
    statuses: ["partial_response", "completed"],
    headerBg: "bg-success/10",
  },
  {
    id: "needs_action",
    label: "Needs Action",
    statuses: ["denied", "overdue", "appealed", "appeal_pending"],
    headerBg: "bg-danger/10",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUrgencyBorder(request: Request): string {
  if (request.status === "denied" || request.status === "overdue") {
    return "border-l-danger";
  }
  if (!request.dueDate) return "border-l-success";
  const days = daysFromNow(request.dueDate);
  if (days < 0) return "border-l-danger";
  if (days <= 10) return "border-l-warning";
  return "border-l-success";
}

function getDueDateColor(request: Request): string {
  if (!request.dueDate) return "text-muted-foreground";
  const days = daysFromNow(request.dueDate);
  if (days < 0) return "text-danger font-medium";
  if (days <= 10) return "text-warning font-medium";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Unique agencies for filter
// ---------------------------------------------------------------------------

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
// Kanban Card
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
        "border border-border bg-surface p-4 mb-3 border-l-[3px] transition-colors hover:border-primary",
        urgencyBorder
      )}
    >
      <p className="font-medium text-sm text-foreground line-clamp-2 mb-2">
        {request.title}
      </p>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="default" size="sm">
          {request.agencyName.length > 30
            ? request.agencyName.substring(0, 28) + "..."
            : request.agencyName}
        </Badge>
        {request.qualityScore !== null && (
          <span className="text-xs text-muted-foreground">
            {request.qualityScore}%
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
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
      <div className="mt-2 relative">
        <select
          value={request.status}
          onChange={(e) =>
            onStatusChange(request.id, e.target.value as RequestStatus)
          }
          className="w-full h-7 appearance-none border border-border bg-surface px-2 pr-6 text-xs text-foreground rounded-none focus:outline-none focus:border-primary"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {getStatusDisplay(s)}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 5L6 8L9 5" />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="border border-border bg-surface p-4 mb-3 border-l-[3px] border-l-muted animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-8" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
    </div>
  );
}

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
      <div className={cn("px-3 py-2.5 flex items-center justify-between", column.headerBg)}>
        <span className="font-heading text-sm text-foreground">{column.label}</span>
        <Badge variant="outline" size="sm">
          {loading ? "-" : requests.length}
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pt-3 pr-1">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No requests
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
// List View
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
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform", currentDir === "desc" && "rotate-180")}
        >
          <path d="M3 5L6 8L9 5" />
        </svg>
      )}
    </button>
  );
}

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
          <tr className="border-b border-border">
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
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 pr-4 font-medium max-w-[300px]">
                  <span className="line-clamp-1">{req.title}</span>
                </td>
                <td className="py-3 pr-4 text-muted-foreground max-w-[200px]">
                  <span className="line-clamp-1">{req.agencyName}</span>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={getStatusVariant(req.status)} size="sm">
                    {getStatusDisplay(req.status)}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {req.qualityScore !== null ? `${req.qualityScore}%` : "\u2014"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {req.filedAt ? formatDate(req.filedAt) : "\u2014"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {req.dueDate ? formatDate(req.dueDate) : "\u2014"}
                </td>
                <td className={cn("py-3", getDueDateColor(req))}>
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
// Analytics Section
// ---------------------------------------------------------------------------

function AnalyticsSection({ requests }: { requests: Request[] }) {
  const [expanded, setExpanded] = useState(false);

  // Status group counts
  const statusGroups = useMemo(() => {
    const groups = COLUMNS.map((col) => ({
      label: col.label,
      count: requests.filter((r) => col.statuses.includes(r.status)).length,
    }));
    return groups;
  }, [requests]);

  // Average response time
  const avgResponseDays = useMemo(() => {
    const responded = requests.filter((r) => r.filedAt && r.respondedAt);
    if (responded.length === 0) return 0;
    const totalDays = responded.reduce((sum, r) => {
      const filed = new Date(r.filedAt!).getTime();
      const responded = new Date(r.respondedAt!).getTime();
      return sum + (responded - filed) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / responded.length);
  }, [requests]);

  // Top agencies
  const topAgencies = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      counts[r.agencyName] = (counts[r.agencyName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [requests]);

  return (
    <div className="border-t border-border mt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full py-4 text-left"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform", expanded && "rotate-90")}
        >
          <path d="M6 4L10 8L6 12" />
        </svg>
        <span className="font-heading text-base text-foreground">Analytics</span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
          {/* By Status */}
          <div className="border border-border bg-surface p-4">
            <h4 className="font-heading text-sm mb-3">By Status</h4>
            <div className="space-y-2">
              {statusGroups.map((g) => (
                <div key={g.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{g.label}</span>
                  <span className="font-medium">{g.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Average Response Time */}
          <div className="border border-border bg-surface p-4">
            <h4 className="font-heading text-sm mb-3">Average Response Time</h4>
            <p className="font-heading text-3xl text-foreground mb-2">{avgResponseDays} days</p>
            <div className="h-2 bg-muted w-full">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.min(100, (avgResponseDays / 120) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>120 days</span>
            </div>
          </div>

          {/* Top Agencies */}
          <div className="border border-border bg-surface p-4">
            <h4 className="font-heading text-sm mb-3">Top Agencies</h4>
            <div className="space-y-3">
              {topAgencies.map((a, i) => (
                <div key={a.name} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-muted text-xs font-medium text-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.count} {a.count === 1 ? "request" : "requests"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      const updated = await updateRequest(id, { status: newStatus });
      if (!updated) {
        // Revert on failure — re-fetch to get true state
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

  // Filter requests
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

  // Group into columns
  const columnData = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      requests: filtered.filter((r) => col.statuses.includes(r.status)),
    }));
  }, [filtered]);

  // Sort toggle
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* View toggle */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setView("board")}
            className={cn(
              "h-8 px-3 text-sm font-medium transition-colors",
              view === "board"
                ? "bg-primary text-white"
                : "border border-border text-foreground hover:bg-muted"
            )}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "h-8 px-3 text-sm font-medium transition-colors",
              view === "list"
                ? "bg-primary text-white"
                : "border border-border text-foreground hover:bg-muted"
            )}
          >
            List
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="h-8 appearance-none border border-border bg-surface px-3 pr-7 text-sm text-foreground rounded-none focus:outline-none focus:border-primary"
            >
              <option value="all">All Agencies</option>
              {agencies.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5L6 8L9 5" />
            </svg>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 appearance-none border border-border bg-surface px-3 pr-7 text-sm text-foreground rounded-none focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5L6 8L9 5" />
            </svg>
          </div>
        </div>

        {/* New Request */}
        <div className="sm:ml-auto">
          <Button variant="primary" size="sm">
            New Request
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && requests.length === 0 ? (
        <div className="border border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No requests to track. Create one to get started.
          </p>
          <Link
            href="/request"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Create Request
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
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-1/5" />
                        <div className="h-4 bg-muted rounded w-16" />
                        <div className="h-4 bg-muted rounded w-10" />
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-12" />
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

          {/* Analytics Section */}
          <AnalyticsSection requests={filtered} />
        </>
      )}
    </div>
  );
}
