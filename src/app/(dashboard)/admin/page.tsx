"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Overview {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  totalRequests: number;
  requestsThisMonth: number;
  totalDocuments: number;
}

interface TierCount {
  tier: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  userEmail: string;
  userName: string | null;
  createdAt: string;
}

interface DailyPoint {
  day: string;
  count: number;
}

interface AnalyticsData {
  overview: Overview;
  usersByTier: TierCount[];
  requestsByStatus: StatusCount[];
  recentActivities: ActivityEntry[];
  dailySignups: DailyPoint[];
  dailyRequests: DailyPoint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tierLabels: Record<string, string> = {
  FREE_TRIAL: "Free Trial",
  STARTER: "Starter",
  PRO: "Pro",
  NEWSROOM: "Newsroom",
};

const tierColors: Record<string, string> = {
  FREE_TRIAL: "bg-muted-foreground",
  STARTER: "bg-primary",
  PRO: "bg-secondary",
  NEWSROOM: "bg-success",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  READY_TO_FILE: "Ready",
  FILED: "Filed",
  ACKNOWLEDGED: "Acknowledged",
  PROCESSING: "Processing",
  PARTIAL_RESPONSE: "Partial",
  COMPLETED: "Completed",
  DENIED: "Denied",
  APPEALED: "Appealed",
  APPEAL_PENDING: "Appeal Pending",
  OVERDUE: "Overdue",
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="border border-border bg-surface p-5 flex-1 min-w-[160px]">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className={cn("font-heading text-3xl", accent || "text-foreground")}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart (simple CSS)
// ---------------------------------------------------------------------------

function BarChart({
  data,
  label,
}: {
  data: DailyPoint[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="border border-border bg-surface p-6">
      <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
        {label}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex items-end gap-px h-32">
          {data.map((d) => {
            const height = (d.count / max) * 100;
            return (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className="w-full bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-foreground text-background text-[10px] px-1.5 py-0.5 whitespace-nowrap z-10">
                  {formatShortDate(d.day)}: {d.count}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data.length > 0 && (
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            {formatShortDate(data[0].day)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatShortDate(data[data.length - 1].day)}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Distribution Bar
// ---------------------------------------------------------------------------

function DistributionBar({
  items,
  labels,
  colors,
  title,
}: {
  items: { key: string; count: number }[];
  labels: Record<string, string>;
  colors: Record<string, string>;
  title: string;
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="border border-border bg-surface p-6">
      <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h3>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden bg-muted mb-4">
            {items.map((item) => {
              const pct = (item.count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={item.key}
                  className={cn("h-full transition-all duration-500", colors[item.key] || "bg-muted-foreground")}
                  style={{ width: `${pct}%` }}
                  title={`${labels[item.key] || item.key}: ${item.count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {items
              .filter((i) => i.count > 0)
              .map((item) => (
                <div key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("w-2 h-2", colors[item.key] || "bg-muted-foreground")} />
                  <span>{labels[item.key] || item.key}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => {
        if (res.status === 403) throw new Error("Access denied. Admin role required.");
        if (!res.ok) throw new Error("Failed to load analytics.");
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statusColors = useMemo(() => {
    const map: Record<string, string> = {};
    const palette = [
      "bg-muted-foreground", "bg-primary/60", "bg-primary", "bg-primary",
      "bg-warning", "bg-success/60", "bg-success", "bg-danger",
      "bg-secondary", "bg-secondary/60", "bg-danger/60",
    ];
    const keys = Object.keys(statusLabels);
    keys.forEach((k, i) => { map[k] = palette[i] || "bg-muted-foreground"; });
    return map;
  }, []);

  if (error) {
    return (
      <div className="border border-danger/20 bg-danger/5 p-8 text-center">
        <h2 className="font-heading text-xl text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted w-1/3 animate-pulse" />
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-border bg-surface p-5 flex-1 min-w-[160px] animate-pulse">
              <div className="h-3 bg-muted w-16 mb-2" />
              <div className="h-8 bg-muted w-12" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border bg-surface p-6 h-48 animate-pulse" />
          <div className="border border-border bg-surface p-6 h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-foreground mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform analytics and foot traffic overview.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Total Users"
          value={data.overview.totalUsers}
          sub={`+${data.overview.newUsersThisWeek} this week`}
        />
        <StatCard
          label="New (30d)"
          value={data.overview.newUsersThisMonth}
          accent="text-primary"
        />
        <StatCard
          label="Total Requests"
          value={data.overview.totalRequests}
          sub={`+${data.overview.requestsThisMonth} this month`}
        />
        <StatCard
          label="Documents"
          value={data.overview.totalDocuments}
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <BarChart data={data.dailySignups} label="Daily Signups (30d)" />
        <BarChart data={data.dailyRequests} label="Daily Requests (30d)" />
      </div>

      {/* Distributions */}
      <div className="grid md:grid-cols-2 gap-6">
        <DistributionBar
          items={data.usersByTier.map((t) => ({ key: t.tier, count: t.count }))}
          labels={tierLabels}
          colors={tierColors}
          title="Users by Plan"
        />
        <DistributionBar
          items={data.requestsByStatus.map((s) => ({ key: s.status, count: s.count }))}
          labels={statusLabels}
          colors={statusColors}
          title="Requests by Status"
        />
      </div>

      {/* Recent Activity Feed */}
      <div className="border border-border bg-surface">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h3>
          <Badge variant="outline" size="sm">
            Last 50
          </Badge>
        </div>
        <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
          {data.recentActivities.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            data.recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-3 flex items-center gap-4">
                {/* Avatar initial */}
                <div className="w-7 h-7 flex items-center justify-center bg-muted text-xs font-medium text-foreground flex-shrink-0">
                  {(activity.userName || activity.userEmail)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">
                      {activity.userName || activity.userEmail.split("@")[0]}
                    </span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {relativeTime(activity.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
