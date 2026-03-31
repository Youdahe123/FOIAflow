"use client";

import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Log In", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="w-full bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter column */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
              Newsletter
            </h3>
            <p className="text-sm text-white/70 mb-4">
              FOIA tips and platform updates. No spam.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                placeholder="you@newsroom.com"
                aria-label="Email address"
                className="h-10 w-full border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-white/50"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-white/90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} FOIAflow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
