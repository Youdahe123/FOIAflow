"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// -- Bump this version string whenever you ship new patch notes. -----------
// The modal will re-appear once for each new version.
const PATCH_VERSION = "2.0.0";
const STORAGE_KEY = "foiaflow_patch_notes_seen";

interface PatchSection {
  title: string;
  badge: string;
  badgeVariant: "primary" | "success" | "warning" | "default";
  items: string[];
}

const PATCH_SECTIONS: PatchSection[] = [
  {
    title: "Request Generator",
    badge: "Upgraded",
    badgeVariant: "primary",
    items: [
      "State & Local agencies now included — covering all 50 states with proper routing to the correct open records law.",
      "Minnesota agencies use the Data Practices Act (Minn. Stat. Ch. 13) — no more FOIA references for state and local requests.",
      "Each agency now displays which law applies (FOIA, Data Practices Act, or state Public Records Act) so you always know the legal framework.",
      "Broad request detection — if your request is too wide (e.g., \"all emails between 2010-2015\"), the system warns you about potential delays and fees and pushes you to narrow by keyword, sender, or date range.",
    ],
  },
  {
    title: "Document Intel",
    badge: "Enhanced",
    badgeVariant: "success",
    items: [
      "Deeper extraction — the analyzer now pulls names, agencies, dates, dollar amounts, and locations from your documents with higher accuracy.",
      "Redaction reasoning — every detected redaction now includes an educated guess on why it was redacted (privacy, national security, law enforcement, deliberative process, etc.).",
      "Pattern detection — the system identifies patterns across names, emails, redactions, and financial data to surface investigative leads.",
      "Improved handling of large documents from agencies like the FBI and CIA.",
    ],
  },
  {
    title: "Document-to-Request Loop",
    badge: "New",
    badgeVariant: "warning",
    items: [
      "Follow-up suggestions now link directly back to the Request Generator with pre-filled descriptions.",
      "Each suggestion tells you exactly what to request, which agency to target, and why it matters based on the analysis.",
      "One click from Document Intel creates a new follow-up request — building a continuous investigative workflow.",
    ],
  },
];

export function PatchNotesModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== PATCH_VERSION) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (SSR, private browsing) — skip
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, PATCH_VERSION);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogClose />

        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>What&apos;s New in FOIAflow</DialogTitle>
            <Badge variant="primary" size="sm">v{PATCH_VERSION}</Badge>
          </div>
          <DialogDescription>
            Major updates to the Request Generator and Document Intel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {PATCH_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-heading text-sm text-foreground">
                  {section.title}
                </h3>
                <Badge variant={section.badgeVariant} size="sm">
                  {section.badge}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-primary mt-1.5 flex-shrink-0">
                      <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                        <rect width="6" height="6" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={handleDismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
