import type { RequestStatus } from "@/types";
import type { BadgeProps } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Status -> Badge variant mapping
// ---------------------------------------------------------------------------

const statusVariantMap: Record<RequestStatus, BadgeProps["variant"]> = {
  draft: "default",
  ready_to_file: "outline",
  filed: "primary",
  acknowledged: "primary",
  processing: "warning",
  partial_response: "success",
  completed: "success",
  denied: "danger",
  overdue: "danger",
  appealed: "secondary",
  appeal_pending: "secondary",
};

export function getStatusVariant(status: RequestStatus): BadgeProps["variant"] {
  return statusVariantMap[status] ?? "default";
}

// ---------------------------------------------------------------------------
// Status -> display text
// ---------------------------------------------------------------------------

const statusDisplayMap: Record<RequestStatus, string> = {
  draft: "Draft",
  ready_to_file: "Ready to File",
  filed: "Filed",
  acknowledged: "Acknowledged",
  processing: "Processing",
  partial_response: "Partial Response",
  completed: "Completed",
  denied: "Denied",
  overdue: "Overdue",
  appealed: "Appealed",
  appeal_pending: "Appeal Pending",
};

export function getStatusDisplay(status: RequestStatus): string {
  return statusDisplayMap[status] ?? status;
}

// ---------------------------------------------------------------------------
// Relative time helper  ("2h ago", "yesterday", "3 days ago", etc.)
// ---------------------------------------------------------------------------

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months}mo ago`;
}
