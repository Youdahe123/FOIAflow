"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toolsNav, accountNav, type NavItem } from "./sidebar";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

function MobileNavLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
        isActive
          ? "bg-accent text-primary font-medium border-l-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted border-l-2 border-transparent"
      )}
    >
      <span className={cn("flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" onClick={onClose}>
            <span className="font-heading text-2xl text-primary tracking-tight">
              FOIAflow
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 text-foreground hover:text-primary transition-colors"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="4" y1="16" x2="16" y2="4" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-6">
            <h2 className="px-4 mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Tools
            </h2>
            <div className="space-y-0.5">
              {toolsNav.map((item) => (
                <MobileNavLink key={item.href} item={item} onClose={onClose} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="px-4 mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Account
            </h2>
            <div className="space-y-0.5">
              {accountNav.map((item) => (
                <MobileNavLink key={item.href} item={item} onClose={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* User info + Logout */}
        <MobileUserSection onClose={onClose} />
      </div>
    </>
  );
}

function MobileUserSection({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string; initials: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUser({
          email: user.email || "",
          name,
          initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        });
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-accent text-primary text-sm font-medium">
          {user?.initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user?.name || "Loading..."}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="mt-3 flex w-full items-center gap-2 px-0 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
          <path d="M7 17H4V3H7" />
          <path d="M11 10H19M16 7L19 10L16 13" />
        </svg>
        Sign out
      </button>
    </div>
  );
}
