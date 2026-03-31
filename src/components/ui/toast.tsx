"use client";

import * as React from "react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

/* --------------------------------- Types --------------------------------- */

type ToastVariant = "default" | "success" | "error" | "info";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
}

/* --------------------------------- Store --------------------------------- */

let counter = 0;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast-${++counter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

/* ---------------------------------- Hook --------------------------------- */

function useToast() {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);
  const clear = useToastStore((s) => s.clear);

  const toast = React.useCallback(
    (props: Omit<Toast, "id">) => {
      return add(props);
    },
    [add],
  );

  return { toast, dismiss: remove, clear };
}

/* ------------------------------ Variant Map ------------------------------ */

const variantClasses: Record<ToastVariant, string> = {
  default: "border border-border",
  success: "border border-border border-l-4 border-l-success",
  error: "border border-border border-l-4 border-l-danger",
  info: "border border-border border-l-4 border-l-primary",
};

/* ------------------------------- ToastItem ------------------------------- */

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const duration = toast.duration ?? 4000;
    const exitTimer = setTimeout(() => setExiting(true), duration - 300);
    const removeTimer = setTimeout(() => remove(toast.id), duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, remove]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-full max-w-sm bg-surface p-4 rounded-none transition-all duration-300",
        exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0",
        variantClasses[toast.variant ?? "default"],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-medium text-foreground">
              {toast.title}
            </p>
          )}
          {toast.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-none p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => remove(toast.id)}
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Toaster -------------------------------- */

function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

Toaster.displayName = "Toaster";

export { useToast, Toaster };
export type { Toast, ToastVariant };
