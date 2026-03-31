import { createClient } from "@/lib/supabase/client";
import type { Request, Document, Activity } from "@/types";

// ── Requests ─────────────────────────────────────────────────────────

export async function createRequest(data: {
  title: string;
  description: string;
  generatedLetter?: string;
  agencyId?: string;
  agencyName?: string;
  status?: string;
  qualityScore?: number;
}): Promise<Request | null> {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.title,
      subject: data.title,
      description: data.description,
      generatedLetter: data.generatedLetter,
      agencyId: data.agencyId,
      status: data.status || "draft",
      qualityScore: data.qualityScore,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function getRequests(): Promise<Request[]> {
  const res = await fetch("/api/requests?limit=100");
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function getRequest(id: string): Promise<Request | null> {
  const res = await fetch(`/api/requests/${id}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function updateRequest(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    generated_letter: string;
    appeal_letter: string;
    agency_id: string;
    agency_name: string;
    status: string;
    quality_score: number;
    filed_at: string;
    due_date: string;
    responded_at: string;
  }>
): Promise<Request | null> {
  // Convert snake_case keys to camelCase for the API
  const body: Record<string, unknown> = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.generated_letter !== undefined) body.generatedLetter = updates.generated_letter;
  if (updates.appeal_letter !== undefined) body.appealLetter = updates.appeal_letter;
  if (updates.agency_id !== undefined) body.agencyId = updates.agency_id;
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.quality_score !== undefined) body.qualityScore = updates.quality_score;
  if (updates.filed_at !== undefined) body.filedAt = updates.filed_at;
  if (updates.due_date !== undefined) body.dueDate = updates.due_date;
  if (updates.responded_at !== undefined) body.respondedAt = updates.responded_at;

  const res = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function deleteRequest(id: string): Promise<boolean> {
  const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
  return res.ok;
}

// ── Documents ────────────────────────────────────────────────────────

export async function uploadDocument(file: File, requestId?: string): Promise<Document | null> {
  // Upload file to Supabase Storage
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  // Create metadata via API
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: requestId || null,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storagePath,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function getDocuments(): Promise<Document[]> {
  const res = await fetch("/api/documents?limit=100");
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function updateDocument(
  id: string,
  updates: Partial<{
    analysis_status: string;
    analysis_result: Record<string, unknown>;
    redaction_count: number;
    page_count: number;
    summary: string;
  }>
): Promise<Document | null> {
  const body: Record<string, unknown> = {};
  if (updates.analysis_status !== undefined) body.analysisStatus = updates.analysis_status;
  if (updates.analysis_result !== undefined) body.analysisResult = updates.analysis_result;
  if (updates.redaction_count !== undefined) body.redactionCount = updates.redaction_count;
  if (updates.page_count !== undefined) body.pageCount = updates.page_count;
  if (updates.summary !== undefined) body.summary = updates.summary;

  const res = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

// ── Activities ───────────────────────────────────────────────────────

export async function getActivities(limit = 15): Promise<Activity[]> {
  const res = await fetch(`/api/activities?limit=${limit}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export async function logActivity(action: string, description: string, requestId?: string) {
  await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, description, requestId: requestId || null }),
  });
}
