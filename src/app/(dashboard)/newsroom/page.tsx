"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getRequests, getActivities } from "@/lib/db";
import type { Request, Activity as ActivityType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";

// ---------------------------------------------------------------------------
// Mock Team Data
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm_1", name: "Sarah Chen", initials: "SC", role: "Editor", color: "bg-primary" },
  { id: "tm_2", name: "Marcus Johnson", initials: "MJ", role: "Reporter", color: "bg-secondary" },
  { id: "tm_3", name: "Aisha Patel", initials: "AP", role: "Reporter", color: "bg-warning" },
  { id: "tm_4", name: "David Kim", initials: "DK", role: "Investigator", color: "bg-success" },
  { id: "tm_5", name: "Lisa Wong", initials: "LW", role: "Data Analyst", color: "bg-primary-light" },
];

// Assign team members to activities
const ACTIVITY_MEMBER_MAP: Record<string, string> = {
  act_01: "tm_1",
  act_02: "tm_5",
  act_03: "tm_2",
  act_04: "tm_3",
  act_05: "tm_4",
  act_06: "tm_1",
  act_07: "tm_5",
  act_08: "tm_2",
  act_09: "tm_3",
  act_10: "tm_1",
  act_11: "tm_4",
  act_12: "tm_2",
  act_13: "tm_3",
  act_14: "tm_1",
  act_15: "tm_4",
};

// Assign team members to requests (deterministic)
function getAssignedMember(requestIndex: number): TeamMember {
  return TEAM_MEMBERS[requestIndex % TEAM_MEMBERS.length];
}

// Requests per member for analytics
const REQUESTS_PER_MEMBER: { member: TeamMember; count: number }[] = [
  { member: TEAM_MEMBERS[0], count: 8 },
  { member: TEAM_MEMBERS[1], count: 6 },
  { member: TEAM_MEMBERS[2], count: 5 },
  { member: TEAM_MEMBERS[3], count: 5 },
  { member: TEAM_MEMBERS[4], count: 4 },
];

const STATUS_BREAKDOWN: { label: string; count: number; variant: string }[] = [
  { label: "Filed", count: 8, variant: "bg-primary" },
  { label: "Processing", count: 5, variant: "bg-warning" },
  { label: "Completed", count: 6, variant: "bg-success" },
  { label: "Denied", count: 3, variant: "bg-danger" },
  { label: "Appealed", count: 4, variant: "bg-secondary" },
  { label: "Draft", count: 2, variant: "bg-muted-foreground" },
];

const MONTHLY_ACTIVITY = [3, 5, 2, 7, 4, 6, 8, 3, 5, 9, 7, 4];
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    case "partial_response":
      return "warning";
    case "completed":
      return "success";
    case "denied":
    case "appealed":
    case "appeal_pending":
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

function timeAgo(dateStr: string): string {
  const now = new Date("2026-03-29T12:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ---------------------------------------------------------------------------
// Top Agencies helper
// ---------------------------------------------------------------------------

function getTopAgencies(requests: Request[]): { name: string; abbreviation: string; count: number }[] {
  const counts: Record<string, { name: string; count: number }> = {};
  requests.forEach((r) => {
    if (!counts[r.agencyId]) {
      counts[r.agencyId] = { name: r.agencyName || r.agencyId, count: 0 };
    }
    counts[r.agencyId].count++;
  });
  return Object.entries(counts)
    .map(([, { name, count }]) => ({
      name,
      abbreviation: name.split(" ").map((w) => w[0]).join("").slice(0, 4),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ activities }: { activities: ActivityType[] }) {
  const stats = [
    { label: "Team Requests", value: "28" },
    { label: "Active Members", value: "5" },
    { label: "Avg. Response Rate", value: "76%" },
    { label: "Requests This Month", value: "7" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {stat.label}
              </p>
              <p className="font-heading text-3xl mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent team activity */}
      <div>
        <h3 className="font-heading text-lg mb-4">Recent Team Activity</h3>
        <div className="border border-border bg-surface">
          {activities.slice(0, 10).map((activity) => {
            const memberId = ACTIVITY_MEMBER_MAP[activity.id] ?? "tm_1";
            const member = TEAM_MEMBERS.find((m) => m.id === memberId) ?? TEAM_MEMBERS[0];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 border-b border-border last:border-b-0"
              >
                <Avatar
                  initials={member.initials}
                  alt={member.name}
                  size="sm"
                  className={cn(member.color, "text-white shrink-0")}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{member.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.action.toLowerCase()}</span>
                  </p>
                  <p className="text-sm text-foreground truncate">{activity.targetTitle}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {timeAgo(activity.createdAt || "")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requests Tab
// ---------------------------------------------------------------------------

function RequestsTab({ requests }: { requests: Request[] }) {
  const [memberFilter, setMemberFilter] = useState("all");

  const requestsWithAssignment = useMemo(() => {
    return requests.map((r, i) => ({
      ...r,
      assignedTo: getAssignedMember(i),
    }));
  }, []);

  const filtered = useMemo(() => {
    if (memberFilter === "all") return requestsWithAssignment;
    return requestsWithAssignment.filter((r) => r.assignedTo.id === memberFilter);
  }, [memberFilter, requestsWithAssignment]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="w-56"
        >
          <option value="all">All Team Members</option>
          {TEAM_MEMBERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Agency</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Assigned To</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Filed</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr
                key={req.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <td className="p-4 font-medium text-foreground max-w-xs truncate">
                  {req.title}
                </td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">
                  {req.agencyName}
                </td>
                <td className="p-4">
                  <Badge variant={statusVariant(req.status)} size="sm">
                    {statusLabel(req.status)}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Avatar
                      initials={req.assignedTo.initials}
                      alt={req.assignedTo.name}
                      size="sm"
                      className={cn(req.assignedTo.color, "text-white")}
                    />
                    <span className="text-sm whitespace-nowrap">{req.assignedTo.name}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">
                  {req.filedAt ? formatDate(req.filedAt) : "\u2014"}
                </td>
                <td className="p-4 text-muted-foreground whitespace-nowrap">
                  {req.dueDate ? formatDate(req.dueDate) : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics Tab
// ---------------------------------------------------------------------------

function AnalyticsTab({ requests }: { requests: Request[] }) {
  const maxRequests = Math.max(...REQUESTS_PER_MEMBER.map((r) => r.count));
  const maxStatus = Math.max(...STATUS_BREAKDOWN.map((s) => s.count));
  const maxMonthly = Math.max(...MONTHLY_ACTIVITY);
  const topAgencies = useMemo(() => getTopAgencies(requests), [requests]);

  return (
    <div className="space-y-8">
      <h3 className="font-heading text-xl">Team Performance</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Member */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REQUESTS_PER_MEMBER.map(({ member, count }) => (
              <div key={member.id} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0 truncate">{member.name}</span>
                <div className="flex-1 h-6 bg-muted overflow-hidden">
                  <div
                    className={cn("h-full transition-[width] duration-500", member.color)}
                    style={{ width: `${(count / maxRequests) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_BREAKDOWN.map(({ label, count, variant }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0">{label}</span>
                <div className="flex-1 h-6 bg-muted overflow-hidden">
                  <div
                    className={cn("h-full transition-[width] duration-500", variant)}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {MONTHLY_ACTIVITY.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{count}</span>
                <div
                  className="w-full bg-primary transition-[height] duration-500"
                  style={{ height: `${(count / maxMonthly) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Agencies Targeted */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Agencies Targeted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topAgencies.map((agency, i) => (
              <div key={agency.abbreviation} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-5">
                  {i + 1}.
                </span>
                <Badge variant="outline" size="sm">
                  {agency.abbreviation}
                </Badge>
                <span className="text-sm flex-1 truncate">{agency.name}</span>
                <span className="text-sm font-medium">
                  {agency.count} request{agency.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

function SettingsTab() {
  const [teamName, setTeamName] = useState("The Investigative Desk");
  const [emailDigest, setEmailDigest] = useState<"daily" | "weekly" | "off">("weekly");

  return (
    <div className="max-w-2xl space-y-8">
      {/* Team Name */}
      <div>
        <Input
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>

      {/* Team Slug */}
      <div>
        <Input
          label="Team Slug"
          value="the-investigative-desk"
          readOnly
          className="bg-muted text-muted-foreground cursor-default"
        />
      </div>

      {/* Email Digest */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Email Digest</p>
        <div className="flex gap-0">
          {(["daily", "weekly", "off"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setEmailDigest(opt)}
              className={cn(
                "px-4 py-2 text-sm font-medium border transition-colors",
                emailDigest === opt
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-foreground border-border hover:bg-muted",
                opt === "daily" && "border-r-0",
                opt === "off" && "border-l-0"
              )}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Slack Integration */}
      <div className="flex items-center justify-between py-4 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Slack Integration</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get notifications in your Slack workspace.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Connect Slack
        </Button>
      </div>

      {/* Webhook URL */}
      <div className="flex items-center justify-between py-4 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Webhook Notifications</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send events to an external URL.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Configure
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="border border-danger/30 p-5 mt-8">
        <h4 className="font-heading text-lg text-danger mb-1">Danger Zone</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this team and all associated data. This action cannot be undone.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-danger text-danger hover:bg-danger hover:text-white"
          disabled
        >
          Delete Team
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NewsroomPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);

  useEffect(() => {
    getRequests().then(setRequests);
    getActivities(15).then(setActivities);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Gating Banner */}
      <div className="bg-accent border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Newsroom Hub</span> is available on the Newsroom plan ($149/month).
        </p>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" asChild>
            <Link href="/pricing">Upgrade to Newsroom</Link>
          </Button>
        </div>
      </div>

      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Your Newsroom</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Collaborate with your team on FOIA investigations.
        </p>
      </div>

      {/* Team members row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <Avatar
                initials={member.initials}
                alt={member.name}
                size="default"
                className={cn(member.color, "text-white")}
              />
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  {member.name}
                </p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="shrink-0" disabled>
          + Invite Member
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab activities={activities} />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab requests={requests} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab requests={requests} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
