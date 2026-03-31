"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getRequests, getActivities } from "@/lib/db";
import { formatDate, daysFromNow, cn } from "@/lib/utils";
import {
  getStatusVariant,
  getStatusDisplay,
  relativeTime,
} from "@/lib/request-utils";
import type { Request, Activity } from "@/types";

// ---------------------------------------------------------------------------
// Small icon components (inline SVGs to avoid external deps)
// ---------------------------------------------------------------------------

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638l-3.96-4.158a.75.75 0 011.08-1.04l5.25 5.5a.75.75 0 010 1.04l-5.25 5.5a.75.75 0 11-1.08-1.04l3.96-4.158H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Deadline row component
// ---------------------------------------------------------------------------

function DeadlineRow({ request }: { request: Request }) {
  const days = daysFromNow(request.dueDate!);
  const isOverdue = days < 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {request.title}
        </p>
        <p className="text-xs text-muted-foreground">{request.agencyName}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        {isOverdue ? (
          <Badge variant="danger" size="sm">
            OVERDUE
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {days} {days === 1 ? "day" : "days"} remaining
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [reqs, acts] = await Promise.all([getRequests(), getActivities()]);
      setRequests(reqs);
      setActivities(acts);
      setLoading(false);
    }
    load();
  }, []);

  // Computed data
  const activeRequests = requests.filter(
    (r) => r.status !== "draft" && r.status !== "completed",
  );

  const pendingResponses = requests.filter(
    (r) =>
      r.status === "filed" ||
      r.status === "acknowledged" ||
      r.status === "processing",
  );

  const recentRequests = [...requests]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  const upcomingDeadlines = requests
    .filter((r) => r.dueDate !== null)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )
    .slice(0, 4);

  const recentActivities = activities.slice(0, 8);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your FOIA requests and activity.
          </p>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="pt-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardContent className="pt-4 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your FOIA requests and activity.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="font-heading text-xl text-foreground">
            No requests yet
          </h2>
          <p className="text-muted-foreground mt-2">
            Create your first FOIA request to get started.
          </p>
          <Link
            href="/request"
            className="mt-6 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your FOIA requests and activity.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">
              Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl text-foreground">
              {activeRequests.length}
            </p>
          </CardContent>
        </Card>

        {/* Pending Responses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">
              Pending Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl text-foreground">
              {pendingResponses.length}
            </p>
            <p className="text-xs text-success mt-1">+2 this week</p>
          </CardContent>
        </Card>

        {/* Avg. Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl text-foreground">34 days</p>
            <p className="text-xs text-success mt-1">&#8595;5 days</p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl text-foreground">73%</p>
            <Progress value={73} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============== Left Column ============== */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Requests ------------------------------------------------ */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-foreground">
                Recent Requests
              </h2>
              <Link
                href="/tracker"
                className="text-sm text-primary hover:underline"
              >
                View All
              </Link>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Agency
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Filed
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => {
                      const duePast =
                        req.dueDate && daysFromNow(req.dueDate) < 0;
                      return (
                        <tr
                          key={req.id}
                          className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/request/${req.id}`}
                              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {req.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {req.agencyName}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getStatusVariant(req.status)} size="sm">
                              {getStatusDisplay(req.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {req.filedAt ? formatDate(req.filedAt) : "\u2014"}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-sm",
                              duePast
                                ? "text-danger font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            {req.dueDate ? formatDate(req.dueDate) : "\u2014"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Upcoming Deadlines --------------------------------------------- */}
          <section>
            <h2 className="font-heading text-xl text-foreground mb-4">
              Upcoming Deadlines
            </h2>
            <Card>
              <CardContent className="pt-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((req) => (
                    <DeadlineRow key={req.id} request={req} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No upcoming deadlines.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ============== Right Column ============== */}
        <div className="space-y-8">
          {/* Quick Actions -------------------------------------------------- */}
          <section>
            <h2 className="font-heading text-xl text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {/* New FOIA Request */}
              <Link
                href="/request"
                className="flex items-center justify-between bg-primary text-white py-4 px-4 border border-primary hover:bg-primary-dark transition-colors"
              >
                <span className="flex items-center gap-3">
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">New FOIA Request</span>
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              {/* Upload Document */}
              <Link
                href="/documents"
                className="flex items-center justify-between bg-surface text-foreground py-4 px-4 border border-border hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-3">
                  <UploadIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Upload Document</span>
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              {/* Find Agency */}
              <Link
                href="/agencies"
                className="flex items-center justify-between bg-surface text-foreground py-4 px-4 border border-border hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-3">
                  <SearchIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Find Agency</span>
                </span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Recent Activity ------------------------------------------------ */}
          <section>
            <h2 className="font-heading text-lg text-foreground mb-4">
              Activity
            </h2>
            <Card>
              <CardContent className="pt-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="py-3 border-b border-border last:border-b-0"
                    >
                      <p className="text-sm">
                        <span className="font-medium text-foreground">
                          {activity.action}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {activity.targetTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relativeTime(activity.timestamp || activity.createdAt || "")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No recent activity.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
