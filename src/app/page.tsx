"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Intersection Observer — single fade-up on scroll, nothing more
   ========================================================================== */

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ==========================================================================
   Letter Preview — the hero's interactive element
   ========================================================================== */

function LetterPreview() {
  const [activeSection, setActiveSection] = useState(0);
  const [paused, setPaused] = useState(false);

  const sections = [
    { label: "Header", accent: "border-l-primary" },
    { label: "Request", accent: "border-l-success" },
    { label: "Scope", accent: "border-l-warning" },
    { label: "Fee Waiver", accent: "border-l-secondary" },
  ];

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % sections.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [paused, sections.length]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="border border-border bg-surface">
        {/* Chrome */}
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Generated FOIA Letter
          </span>
          <span className="inline-flex items-center bg-success/10 text-success border border-success/20 px-2 py-0.5 text-[11px] font-medium">
            Quality: 94/100
          </span>
        </div>

        {/* Section tabs */}
        <div className="border-b border-border px-5 flex">
          {sections.map((section, i) => (
            <button
              key={section.label}
              onClick={() => setActiveSection(i)}
              className={cn(
                "px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2",
                i === activeSection
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          <div
            className={cn(
              "p-4 border-l-2 bg-muted/30 transition-all duration-300",
              sections[activeSection].accent
            )}
          >
            {activeSection === 0 && (
              <div className="font-document text-sm text-foreground/80 space-y-1.5">
                <p className="font-bold">FOIA Officer</p>
                <p>Chicago Police Department</p>
                <p>3510 S. Michigan Ave, Chicago, IL 60653</p>
                <p className="mt-3 font-bold">
                  Re: Police Use-of-Force Records, 2023-2024
                </p>
              </div>
            )}
            {activeSection === 1 && (
              <div className="font-document text-sm text-foreground/80 space-y-2.5">
                <p>
                  Pursuant to the Illinois Freedom of Information Act, 5 ILCS
                  140/1 et seq., I am requesting access to and copies of the
                  following records:
                </p>
                <p className="font-medium text-foreground">
                  All use-of-force reports, including officer identification,
                  incident summaries, and disciplinary outcomes for January 1,
                  2023, through December 31, 2024.
                </p>
              </div>
            )}
            {activeSection === 2 && (
              <div className="font-document text-sm text-foreground/80 space-y-2.5">
                <p className="font-medium mb-2">
                  This request specifically includes:
                </p>
                <ul className="space-y-1">
                  {[
                    "Tactical Response Reports (TRRs)",
                    "Officer identification numbers and assignments",
                    "Disciplinary investigation outcomes",
                    "Use-of-force review board decisions",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeSection === 3 && (
              <div className="font-document text-sm text-foreground/80 space-y-2.5">
                <p>
                  I am a representative of the news media as defined under 5
                  U.S.C. &sect; 552(a)(4)(A)(ii)(II). This request is made as
                  part of news gathering and not for commercial use.
                </p>
                <p className="font-medium text-primary">
                  I therefore request a waiver of all fees associated with this
                  request pursuant to 5 ILCS 140/6.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Feature data
   ========================================================================== */

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
    title: "Request Builder",
    description:
      "Describe what you need in plain language. AI generates a legally precise FOIA letter, selects the right agency, and scores it for quality before you file.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    title: "Request Tracker",
    description:
      "Kanban board and list views with statutory deadline tracking. Automatic reminders before deadlines hit. Full pipeline analytics.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
    title: "Document Intel",
    description:
      "Upload agency responses. AI identifies redactions, maps exemption codes, extracts key entities, and suggests follow-up requests.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Agency Finder",
    description:
      "Search 100+ federal, state, and local agencies. Compare compliance ratings, average response times, and FOIA officer contacts.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Newsroom Hub",
    description:
      "Shared workspaces for editorial teams. Collaborative request management, team analytics, and assignment workflows.",
  },
];

/* ==========================================================================
   How it works data
   ========================================================================== */

const steps = [
  {
    number: "1",
    title: "Describe your request",
    description:
      "Tell us what records you need in plain language. The AI understands journalistic intent, legal specificity, and which agency holds the records.",
  },
  {
    number: "2",
    title: "Review the generated letter",
    description:
      "Get a legally precise FOIA letter citing the correct statute, auto-routed to the right agency, with a quality score and improvement suggestions.",
  },
  {
    number: "3",
    title: "Track through resolution",
    description:
      "Monitor statutory deadlines, get notified on status changes, analyze responses when they arrive, and auto-generate appeals if needed.",
  },
];

/* ==========================================================================
   Page
   ========================================================================== */

export default function HomePage() {
  const featuresReveal = useReveal(0.1);
  const howReveal = useReveal(0.1);
  const ctaReveal = useReveal(0.15);

  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left */}
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-primary mb-6">
                  AI-Powered FOIA Requests
                </p>

                <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] text-foreground leading-[1.1] mb-6">
                  File Smarter.{" "}
                  <br className="hidden sm:block" />
                  Get Answers{" "}
                  <span className="text-primary">Faster</span>.
                </h1>

                <p className="text-base lg:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                  Snowden generates legally precise FOIA letters, routes them to
                  the right agency, and tracks every request from filing to
                  response. Built for investigative journalists.
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <Button variant="primary" size="lg" asChild>
                    <Link href="/signup">
                      Start Free Trial
                      <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#how-it-works">How It Works</Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  7-day free trial &middot; No credit card required
                </p>
              </div>

              {/* Right */}
              <div className="hidden lg:block">
                <LetterPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── Credibility strip ──────────────────────────────────────── */}
        <div className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary flex-shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>100+ agencies indexed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Statutory deadline tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary flex-shrink-0">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Federal, state & local coverage</span>
            </div>
          </div>
        </div>

        {/* ── Features ────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              ref={featuresReveal.ref}
              className={cn(
                "transition-all duration-700 ease-out",
                featuresReveal.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              )}
            >
              <div className="max-w-2xl mb-12">
                <h2 className="font-heading text-3xl lg:text-4xl text-foreground mb-3">
                  Everything you need to file,{" "}
                  <br className="hidden lg:block" />
                  track, and win FOIA requests
                </h2>
                <p className="text-muted-foreground">
                  Five tools in one platform, purpose-built for investigative
                  journalism.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-surface p-6 lg:p-8 group"
                  >
                    <div className="text-primary mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-heading text-lg text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
                {/* Fill grid */}
                <div className="hidden lg:block bg-surface p-6 lg:p-8">
                  <div className="flex flex-col items-start justify-center h-full">
                    <p className="font-heading text-lg text-foreground mb-2">
                      More coming soon
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      We ship new capabilities every week based on what
                      journalists actually need.
                    </p>
                    <Link
                      href="/signup"
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      Get early access
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="py-20 lg:py-28 bg-surface border-y border-border"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              ref={howReveal.ref}
              className={cn(
                "transition-all duration-700 ease-out",
                howReveal.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              )}
            >
              <div className="max-w-2xl mb-14">
                <h2 className="font-heading text-3xl lg:text-4xl text-foreground mb-3">
                  From question to filed request{" "}
                  <br className="hidden lg:block" />
                  in under five minutes
                </h2>
                <p className="text-muted-foreground">
                  Three steps. No legal expertise required.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-px bg-transparent lg:bg-border lg:border lg:border-border">
                {steps.map((step, i) => (
                  <div key={step.number} className="bg-background lg:bg-surface p-0 lg:p-8">
                    {/* Mobile: timeline connector */}
                    <div className="flex items-start gap-5 lg:block">
                      <div className="flex flex-col items-center lg:hidden">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary text-white text-sm font-medium flex-shrink-0">
                          {step.number}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="w-px h-full bg-border min-h-[60px]" />
                        )}
                      </div>

                      <div className={cn("pb-8 lg:pb-0", i === steps.length - 1 && "pb-0")}>
                        {/* Desktop: number */}
                        <span className="hidden lg:block font-heading text-4xl text-border mb-4">
                          {step.number.padStart(2, "0")}
                        </span>
                        <h3 className="font-heading text-lg text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pull quote ──────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-6 text-border">
              <path d="M10 11H6C6 7.686 8.686 5 12 5V3C7.582 3 4 6.582 4 11V19H10V11ZM22 11H18C18 7.686 20.686 5 24 5V3C19.582 3 16 6.582 16 11V19H22V11Z" fill="currentColor" />
            </svg>
            <blockquote className="font-heading text-2xl lg:text-3xl text-foreground leading-snug mb-6">
              The difference between a good FOIA request and a great one is
              knowing the statute, the agency, and the right language. That
              shouldn&apos;t require a law degree.
            </blockquote>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              The premise behind Snowden
            </p>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-surface">
          <div
            ref={ctaReveal.ref}
            className={cn(
              "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 transition-all duration-700 ease-out",
              ctaReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            )}
          >
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-3xl lg:text-4xl text-foreground mb-4">
                Start filing better FOIA requests today
              </h2>
              <p className="text-muted-foreground mb-8">
                Free 7-day trial. Works with federal, state, and local agencies.
                No credit card required.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
