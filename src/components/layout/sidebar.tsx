"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const toolsNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <rect x="2" y="2" width="7" height="7" />
        <rect x="11" y="2" width="7" height="7" />
        <rect x="2" y="11" width="7" height="7" />
        <rect x="11" y="11" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Request Builder",
    href: "/request",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M12 2L15 5L6 14H3V11L12 2Z" />
        <line x1="3" y1="17" x2="17" y2="17" />
      </svg>
    ),
  },
  {
    label: "Tracker",
    href: "/tracker",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <line x1="4" y1="2" x2="4" y2="18" />
        <line x1="10" y1="2" x2="10" y2="18" />
        <line x1="16" y1="2" x2="16" y2="18" />
        <line x1="2" y1="5" x2="6" y2="5" />
        <line x1="8" y1="8" x2="12" y2="8" />
        <line x1="14" y1="6" x2="18" y2="6" />
      </svg>
    ),
  },
  {
    label: "Document Intel",
    href: "/documents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M4 2H12L16 6V18H4V2Z" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="6" x2="16" y2="6" />
        <line x1="7" y1="10" x2="13" y2="10" />
        <line x1="7" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    label: "Agency Finder",
    href: "/agencies",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="9" cy="9" r="6" />
        <line x1="13.5" y1="13.5" x2="18" y2="18" />
      </svg>
    ),
  },
  {
    label: "Newsroom Hub",
    href: "/newsroom",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="7" cy="7" r="3" />
        <circle cx="13" cy="7" r="3" />
        <path d="M2 16C2 13.5 4.2 12 7 12C8 12 8.8 12.2 9.5 12.5" />
        <path d="M10.5 12.5C11.2 12.2 12 12 13 12C15.8 12 18 13.5 18 16" />
      </svg>
    ),
  },
];

const accountNav: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.2 4.2L5.6 5.6M14.4 14.4L15.8 15.8M15.8 4.2L14.4 5.6M5.6 14.4L4.2 15.8" />
      </svg>
    ),
  },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-accent text-primary font-medium border-l-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted border-l-2 border-transparent"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email: string;
    name: string;
    initials: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        setUser({
          email: user.email || "",
          name,
          initials: name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        });
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface border-r border-border z-40">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard">
          <span className="font-heading text-2xl text-primary tracking-tight">
            FOIAflow
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="mb-6">
          <h2 className="px-4 mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Tools
          </h2>
          <div className="space-y-0.5">
            {toolsNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="px-4 mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Account
          </h2>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User info */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-accent text-primary text-sm font-medium">
            {user?.initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name || "Loading..."}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M7 17H4V3H7" />
              <path d="M11 10H19M16 7L19 10L16 13" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export { toolsNav, accountNav };
export type { NavItem };
