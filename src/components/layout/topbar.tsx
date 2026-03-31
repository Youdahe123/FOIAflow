import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TopbarProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ title = "Dashboard", onMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center p-2 text-foreground hover:text-primary transition-colors"
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <h1 className="font-heading text-xl text-foreground">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" asChild>
          <Link href="/request">New Request</Link>
        </Button>

        {/* Notification bell */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
            <path d="M10 2C7 2 5 4.5 5 7V12L3 14H17L15 12V7C15 4.5 13 2 10 2Z" />
            <path d="M8 14V15C8 16.1 8.9 17 10 17C11.1 17 12 16.1 12 15V14" />
          </svg>
        </button>

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center bg-accent text-primary text-xs font-medium">
          DU
        </div>
      </div>
    </header>
  );
}
