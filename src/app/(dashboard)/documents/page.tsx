"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { uploadDocument, getDocuments, updateDocument } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Document, AnalysisStatus } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAnalysisBadgeVariant(
  status: AnalysisStatus
): "default" | "warning" | "success" | "danger" {
  switch (status) {
    case "pending":
      return "default";
    case "analyzing":
      return "warning";
    case "completed":
      return "success";
    case "failed":
      return "danger";
  }
}

function getAnalysisLabel(status: AnalysisStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "analyzing":
      return "Analyzing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}

// ---------------------------------------------------------------------------
// File Icons
// ---------------------------------------------------------------------------

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="2" width="24" height="28" stroke="#6B0000" strokeWidth="1.5" />
      <path d="M4 22H28V30H4V22Z" fill="#6B0000" />
      <text
        x="16"
        y="28"
        textAnchor="middle"
        fill="white"
        fontSize="7"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        PDF
      </text>
      <line x1="9" y1="8" x2="23" y2="8" stroke="#E5E5E0" strokeWidth="1.5" />
      <line x1="9" y1="12" x2="23" y2="12" stroke="#E5E5E0" strokeWidth="1.5" />
      <line x1="9" y1="16" x2="18" y2="16" stroke="#E5E5E0" strokeWidth="1.5" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="24" height="24" stroke="#6B6B6B" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="#6B6B6B" strokeWidth="1.5" />
      <path d="M4 22L12 16L18 20L22 17L28 22V28H4V22Z" fill="#E5E5E0" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <path d="M20 28V8" />
      <path d="M12 16L20 8L28 16" />
      <path d="M6 32H34" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Upload Zone
// ---------------------------------------------------------------------------

function UploadZone({
  onFileSelect,
  uploading,
  uploadProgress,
}: {
  onFileSelect: (files: FileList | null) => void;
  uploading: boolean;
  uploadProgress: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        "border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary bg-muted/30",
        uploading && "pointer-events-none opacity-70"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        multiple
        onChange={(e) => onFileSelect(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <UploadIcon />
        {uploading ? (
          <>
            <p className="text-lg font-medium text-foreground">
              Uploading...
            </p>
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-foreground">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOC, DOCX, PNG, JPG &mdash; Max 25MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Card
// ---------------------------------------------------------------------------

function DocumentCard({
  doc,
  onAnalyze,
  analyzingId,
}: {
  doc: Document;
  onAnalyze: (docId: string, fileName: string) => void;
  analyzingId: string | null;
}) {
  const isPdf = doc.fileType === "application/pdf";
  const badgeVariant = getAnalysisBadgeVariant(doc.analysisStatus);
  const badgeLabel = getAnalysisLabel(doc.analysisStatus);

  return (
    <div className="border border-border bg-surface">
      {/* Top section: file info */}
      <div className="p-4 flex items-start gap-3">
        {isPdf ? (
          <PdfIcon className="flex-shrink-0" />
        ) : (
          <ImageIcon className="flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {doc.fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(doc.fileSize)} &middot; {doc.pageCount}{" "}
            {doc.pageCount === 1 ? "page" : "pages"}
          </p>
        </div>
      </div>

      {/* Middle section: analysis */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant={badgeVariant}
            size="sm"
            className={cn(
              doc.analysisStatus === "analyzing" && "animate-pulse"
            )}
          >
            {badgeLabel}
          </Badge>
        </div>
        {doc.analysisStatus === "completed" && doc.redactionCount > 0 && (
          <p className="text-sm text-foreground mb-1">
            {doc.redactionCount} redaction{doc.redactionCount !== 1 ? "s" : ""}{" "}
            detected
          </p>
        )}
        {doc.analysisStatus === "completed" && doc.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {doc.summary}
          </p>
        )}
        {doc.analysisStatus === "analyzing" && (
          <p className="text-sm text-muted-foreground">
            AI analysis in progress...
          </p>
        )}
        {doc.analysisStatus === "failed" && (
          <p className="text-sm text-danger">
            Analysis failed. The file may be corrupted or unsupported.
          </p>
        )}
      </div>

      {/* Bottom section: actions */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <div>
          {doc.analysisStatus === "completed" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/documents/${doc.id}`}>View Analysis</Link>
            </Button>
          )}
          {doc.analysisStatus === "analyzing" && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </div>
          )}
          {doc.analysisStatus === "failed" && (
            <Button
              variant="outline"
              size="sm"
              disabled={analyzingId === doc.id}
              onClick={() => onAnalyze(doc.id, doc.fileName)}
            >
              Retry
            </Button>
          )}
          {doc.analysisStatus === "pending" && (
            <Button
              variant="outline"
              size="sm"
              disabled={analyzingId === doc.id}
              onClick={() => onAnalyze(doc.id, doc.fileName)}
            >
              Analyze
            </Button>
          )}
        </div>
        {doc.requestTitle && (
          <span className="text-xs text-primary truncate max-w-[160px]">
            {doc.requestTitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort / filter types
// ---------------------------------------------------------------------------

type SortBy = "date" | "name" | "size";
type FilterStatus = "all" | AnalysisStatus;

// ---------------------------------------------------------------------------
// Main Documents Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const docs = await getDocuments();
    setDocuments(docs);
    setLoading(false);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      setUploadProgress(30);
      const doc = await uploadDocument(file);
      setUploadProgress(70);
      if (doc) {
        setDocuments(prev => [doc, ...prev]);
      }
      setUploadProgress(100);
    }

    setUploading(false);
    setUploadProgress(0);
  }

  async function handleAnalyze(docId: string, fileName: string) {
    setAnalyzing(docId);

    // Update status to analyzing
    await updateDocument(docId, { analysis_status: "analyzing" });
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, analysisStatus: "analyzing" } : d));

    try {
      const res = await fetch("/api/ai/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: `[Document: ${fileName}] This is a FOIA response document. Analyze it for redactions, exemption codes, key entities, and suggest follow-up requests.`,
          fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDocument(docId, {
        analysis_status: "completed",
        analysis_result: data,
        redaction_count: data.redactions?.length || 0,
        summary: data.summary,
      });

      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        analysisStatus: "completed",
        analysisResult: data,
        redactionCount: data.redactions?.length || 0,
        summary: data.summary,
      } : d));
    } catch (err) {
      await updateDocument(docId, { analysis_status: "failed" });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, analysisStatus: "failed" } : d));
    }

    setAnalyzing(null);
  }

  // Filter
  const filtered = useMemo(() => {
    let docs = [...documents];
    if (filterStatus !== "all") {
      docs = docs.filter((d) => d.analysisStatus === filterStatus);
    }
    return docs;
  }, [documents, filterStatus]);

  // Sort
  const sorted = useMemo(() => {
    const docs = [...filtered];
    switch (sortBy) {
      case "date":
        docs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "name":
        docs.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "size":
        docs.sort((a, b) => b.fileSize - a.fileSize);
        break;
    }
    return docs;
  }, [filtered, sortBy]);

  // Counts
  const totalCount = documents.length;
  const filteredCount = sorted.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-dashed p-8 bg-muted/30 animate-pulse h-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border bg-surface animate-pulse">
              <div className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
              <div className="p-4 border-t border-border">
                <div className="h-7 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <UploadZone
        onFileSelect={handleFileUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Filter / Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filterStatus === "all"
              ? `All Documents (${totalCount})`
              : `${getAnalysisLabel(filterStatus as AnalysisStatus)} (${filteredCount})`}
          </span>
          <div className="flex">
            {(["all", "pending", "analyzing", "completed", "failed"] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium transition-colors",
                    filterStatus === status
                      ? "bg-primary text-white"
                      : "border border-border text-foreground hover:bg-muted"
                  )}
                >
                  {status === "all" ? "All" : getAnalysisLabel(status)}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="h-7 appearance-none border border-border bg-surface px-2.5 pr-6 text-xs text-foreground rounded-none focus:outline-none focus:border-primary"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
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
      </div>

      {/* Document Grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onAnalyze={handleAnalyze}
              analyzingId={analyzing}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">
            {filterStatus !== "all" ? "No documents found" : "No documents yet"}
          </p>
          <p className="text-sm">
            {filterStatus !== "all"
              ? "Try changing your filter criteria."
              : "No documents yet. Upload a FOIA response to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
