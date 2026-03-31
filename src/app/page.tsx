"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";

/* ==========================================================================
   Intersection Observer hook — triggers scroll animations
   ========================================================================== */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ==========================================================================
   Animated counter — counts up from 0 to target
   ========================================================================== */

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ==========================================================================
   Typewriter effect for hero headline
   ========================================================================== */

function TypewriterText({
  texts,
  className,
}: {
  texts: string[];
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[currentIndex];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && displayed === current) {
      const timeout = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayed(
        isDeleting
          ? current.slice(0, displayed.length - 1)
          : current.slice(0, displayed.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, currentIndex, texts]);

  return (
    <span className={className}>
      {displayed}
      <span
        className="inline-block w-[3px] h-[1em] bg-primary ml-0.5 align-baseline"
        style={{ animation: "cursor-blink 1s step-end infinite" }}
      />
    </span>
  );
}

/* ==========================================================================
   Interactive letter preview — types out live
   ========================================================================== */

function LiveLetterPreview() {
  const [activeSection, setActiveSection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const reveal = useScrollReveal(0.2);

  const letterSections = [
    { label: "Header", color: "bg-primary/5 border-l-2 border-l-primary" },
    { label: "Request", color: "bg-success/5 border-l-2 border-l-success" },
    { label: "Scope", color: "bg-warning/5 border-l-2 border-l-warning" },
    { label: "Fee Waiver", color: "bg-secondary/5 border-l-2 border-l-secondary" },
  ];

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % letterSections.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered, letterSections.length]);

  return (
    <div
      ref={reveal.ref}
      className={`animate-slide-right ${reveal.isVisible ? "is-visible" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="border border-border bg-surface relative overflow-hidden transition-all duration-500">
        {/* Top bar */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-danger/40" />
              <div className="w-3 h-3 rounded-full bg-warning/40" />
              <div className="w-3 h-3 rounded-full bg-success/40" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Generated FOIA Letter
            </span>
          </div>
          <span className="inline-flex items-center bg-success/10 text-success border border-success/20 px-2.5 py-1 text-xs font-medium">
            <span
              className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"
              style={{ animation: "count-pulse 2s ease-in-out infinite" }}
            />
            Score: 94/100
          </span>
        </div>

        {/* Section tabs */}
        <div className="border-b border-border px-6 flex gap-0">
          {letterSections.map((section, i) => (
            <button
              key={section.label}
              onClick={() => setActiveSection(i)}
              className={`px-4 py-2.5 text-xs font-medium transition-all duration-300 border-b-2 ${
                i === activeSection
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Letter content */}
        <div className="p-6 space-y-4">
          <div
            className={`p-4 transition-all duration-500 ${letterSections[activeSection].color}`}
          >
            {activeSection === 0 && (
              <div className="font-document text-sm text-foreground/80 space-y-2">
                <p className="font-bold">FOIA Officer</p>
                <p>Chicago Police Department</p>
                <p>3510 S. Michigan Ave</p>
                <p>Chicago, IL 60653</p>
                <p className="mt-3 font-bold">
                  Re: Police Use-of-Force Records, 2023–2024
                </p>
              </div>
            )}
            {activeSection === 1 && (
              <div className="font-document text-sm text-foreground/80 space-y-3">
                <p>
                  Pursuant to the Illinois Freedom of Information Act, 5 ILCS
                  140/1 et seq., I am requesting access to and copies of the
                  following records:
                </p>
                <p className="font-medium">
                  All use-of-force reports, including officer identification,
                  incident summaries, and disciplinary outcomes for January 1,
                  2023, through December 31, 2024.
                </p>
              </div>
            )}
            {activeSection === 2 && (
              <div className="font-document text-sm text-foreground/80 space-y-3">
                <p className="font-medium mb-2">
                  This request specifically includes:
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Tactical Response Reports (TRRs)",
                    "Officer identification numbers and assignments",
                    "Disciplinary investigation outcomes",
                    "Use-of-force review board decisions",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeSection === 3 && (
              <div className="font-document text-sm text-foreground/80 space-y-3">
                <p>
                  I am a representative of the news media as defined under 5
                  U.S.C. § 552(a)(4)(A)(ii)(II). This request is made as part
                  of news gathering and not for commercial use.
                </p>
                <p className="font-medium text-primary">
                  I therefore request a waiver of all fees associated with this
                  request pursuant to 5 ILCS 140/6.
                </p>
              </div>
            )}
          </div>

          {/* Animated lines underneath */}
          <div className="space-y-2 pt-2">
            {[80, 95, 70, 60].map((width, i) => (
              <div
                key={i}
                className="h-2 bg-muted overflow-hidden"
                style={{ width: `${width}%` }}
              >
                <div
                  className="h-full bg-muted-foreground/10"
                  style={{
                    animation: `shimmer 2s ease-in-out infinite`,
                    animationDelay: `${i * 200}ms`,
                    background:
                      "linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
            ))}
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
    title: "Request Builder",
    description:
      "Generate legally precise FOIA letters with AI. Auto-select agencies. Score quality. One-click filing.",
    stat: "4-step wizard",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    title: "Tracker",
    description:
      "Kanban-style tracking with statutory deadlines, auto reminders, and request analytics.",
    stat: "Kanban + list view",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="13" y2="13" />
      </svg>
    ),
    title: "Document Intel",
    description:
      "Upload FOIA responses. AI detects redactions, identifies exemption codes, suggests follow-ups.",
    stat: "6 exemption codes",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Agency Finder",
    description:
      "Search 2,400+ federal, state, and local agencies. Compare compliance ratings and response times.",
    stat: "2,400+ agencies",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: "Newsroom Hub",
    description:
      "Team workflows, shared analytics, editorial dashboards, and collaborative FOIA management.",
    stat: "Up to 10 seats",
  },
];

const steps = [
  {
    number: "01",
    title: "Describe your request",
    description:
      "Tell us what information you need in plain language. Our AI understands journalistic intent and legal requirements.",
    demo: "I want all records related to the FBI's use of facial recognition technology...",
  },
  {
    number: "02",
    title: "AI generates & routes",
    description:
      "Get a legally precise FOIA letter auto-routed to the right agency, with a quality score and improvement suggestions.",
    demo: "Pursuant to 5 U.S.C. § 552, I hereby request access to...",
  },
  {
    number: "03",
    title: "Track & follow up",
    description:
      "Monitor statutory deadlines, analyze responses when they arrive, and auto-generate appeals if you get stonewalled.",
    demo: "Request filed → Acknowledged → Processing → Response received",
  },
];

/* ==========================================================================
   Interactive "How It Works" step
   ========================================================================== */

function InteractiveSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const reveal = useScrollReveal(0.15);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={reveal.ref}
      className={`animate-on-scroll ${reveal.isVisible ? "is-visible" : ""}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — steps list */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(i)}
              className={`w-full text-left p-6 border transition-all duration-500 group ${
                i === activeStep
                  ? "border-primary bg-primary/[0.03]"
                  : "border-border bg-surface hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`font-heading text-3xl transition-colors duration-300 ${
                    i === activeStep ? "text-primary" : "text-border"
                  }`}
                >
                  {step.number}
                </span>
                <div>
                  <h3
                    className={`font-heading text-lg transition-colors duration-300 ${
                      i === activeStep ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed mt-1 transition-all duration-500 ${
                      i === activeStep
                        ? "text-muted-foreground max-h-20 opacity-100"
                        : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              {i === activeStep && (
                <div className="mt-4 ml-12 h-0.5 bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      animation: "draw-line 4s linear forwards",
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right — demo preview */}
        <div className="relative">
          <div className="border border-border bg-surface overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-danger/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                FOIAflow — {steps[activeStep].title}
              </span>
            </div>

            <div className="p-6 min-h-[280px] flex flex-col justify-center">
              {activeStep === 0 && (
                <div className="space-y-4" key="step0">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What information do you need?
                  </label>
                  <div className="border border-border p-4 min-h-[120px] font-body text-sm text-foreground">
                    <TypewriterText
                      texts={[
                        "All records related to the FBI's use of facial recognition technology between 2020-2024...",
                        "EPA water quality testing data for the Flint, Michigan water supply from 2014-present...",
                        "ICE detention facility inspection reports from the last 3 years...",
                      ]}
                      className="text-foreground"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Records about...", "Communications between...", "Contracts for..."].map((s) => (
                      <span key={s} className="border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4" key="step1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Generated Letter
                    </span>
                    <span className="bg-success/10 text-success border border-success/20 px-2 py-0.5 text-xs font-medium">
                      Score: 91
                    </span>
                  </div>
                  <div className="border border-border p-4 font-document text-xs text-foreground/80 space-y-2 leading-relaxed">
                    <p className="font-bold">FOIA Officer, FBI</p>
                    <p>
                      Pursuant to the Freedom of Information Act, 5 U.S.C. §
                      552, I hereby request access to and copies of all records
                      related to...
                    </p>
                    <div className="border-l-2 border-l-primary pl-3 text-foreground">
                      All facial recognition technology contracts,
                      evaluations, accuracy audits, and deployment
                      records from January 2020 to present.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    Auto-routed to FBI FOIA Office
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-3" key="step2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Request Tracker
                  </span>
                  <div className="space-y-2">
                    {[
                      { status: "Filed", date: "Mar 1", color: "bg-primary", active: true },
                      { status: "Acknowledged", date: "Mar 5", color: "bg-primary", active: true },
                      { status: "Processing", date: "Mar 12", color: "bg-warning", active: true },
                      { status: "Due Date", date: "Mar 21", color: "bg-border", active: false },
                    ].map((item, i) => (
                      <div key={item.status} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${item.active ? item.color : "border-2 border-border"} transition-all duration-500`}
                            style={{
                              animation: item.active && i === 2
                                ? "count-pulse 2s ease-in-out infinite"
                                : undefined,
                            }}
                          />
                          {i < 3 && (
                            <div className={`w-px h-6 ${item.active ? "bg-primary/30" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="flex items-center justify-between flex-1">
                          <span className={`text-sm ${item.active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-warning/5 border border-warning/20 text-xs text-warning font-medium">
                    Statutory deadline in 9 days — auto-reminder scheduled
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Marquee — scrolling logos / trust bar
   ========================================================================== */

function TrustMarquee() {
  const publications = [
    "The Washington Post",
    "ProPublica",
    "The New York Times",
    "The Intercept",
    "Reuters",
    "Associated Press",
    "The Guardian",
    "Reveal News",
    "The Marshall Project",
    "Bellingcat",
  ];

  return (
    <div className="overflow-hidden border-y border-border bg-surface py-5">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...publications, ...publications].map((pub, i) => (
          <span
            key={`${pub}-${i}`}
            className="mx-8 text-sm font-medium text-muted-foreground/50 tracking-wide uppercase"
          >
            {pub}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

/* ==========================================================================
   Page
   ========================================================================== */

export default function HomePage() {
  const heroReveal = useScrollReveal(0.1);
  const featuresReveal = useScrollReveal(0.1);
  const statsReveal = useScrollReveal(0.2);
  const ctaReveal = useScrollReveal(0.2);

  // Parallax on hero
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left */}
              <div
                ref={heroReveal.ref}
                className={`animate-slide-left ${heroReveal.isVisible ? "is-visible" : ""}`}
              >
                <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5 mb-6">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ animation: "count-pulse 2s ease-in-out infinite" }}
                  />
                  <span className="text-xs font-medium uppercase tracking-widest text-primary">
                    AI-Powered FOIA Requests
                  </span>
                </div>

                <h1 className="font-heading text-5xl lg:text-[3.5rem] xl:text-6xl text-foreground leading-[1.08] mb-6">
                  File Smarter.
                  <br />
                  Get Answers{" "}
                  <span className="relative inline-block">
                    Faster
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary/20" />
                  </span>
                  .
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                  FOIAflow generates legally precise FOIA letters, auto-routes
                  them to the right agency, and tracks every request from filing
                  to response.
                </p>

                <div className="flex flex-wrap gap-4 mb-5">
                  <Button variant="primary" size="lg" asChild>
                    <Link href="/signup">
                      Start Free Trial
                      <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  7-day free trial. Cancel anytime.
                </p>
              </div>

              {/* Right — interactive letter preview */}
              <div className="hidden lg:block">
                <LiveLetterPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Marquee ───────────────────────────────────────────── */}
        <TrustMarquee />

        {/* ��─ Features ────────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              ref={featuresReveal.ref}
              className={`text-center mb-16 animate-on-scroll ${featuresReveal.isVisible ? "is-visible" : ""}`}
            >
              <h2 className="font-heading text-4xl lg:text-5xl text-foreground mb-4">
                Five tools. One platform.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything journalists need to file, track, and win FOIA
                requests.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children ${featuresReveal.isVisible ? "is-visible" : ""}`}
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group border border-border bg-surface p-8 hover-lift cursor-default"
                >
                  <div className="text-primary mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-xl text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <span className="inline-block border border-border px-2.5 py-1 text-xs font-medium text-primary">
                    {feature.stat}
                  </span>
                </div>
              ))}
              {/* Empty cell to fill grid */}
              <div className="hidden lg:block" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ── How It Works — Interactive ──────────────────────────────── */}
        <section id="how-it-works" className="py-24 lg:py-32 bg-surface border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl lg:text-5xl text-foreground mb-4">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three steps from question to filed request.
              </p>
            </div>
            <InteractiveSteps />
          </div>
        </section>

        {/* ── Stats — Animated Counters ──��────────────────────────────── */}
        <section className="py-20 bg-primary text-white">
          <div
            ref={statsReveal.ref}
            className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 stagger-children ${statsReveal.isVisible ? "is-visible" : ""}`}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              <div className="text-center">
                <p className="font-heading text-4xl lg:text-5xl mb-2">
                  <AnimatedCounter target={15000} suffix="+" />
                </p>
                <p className="text-sm uppercase tracking-wider opacity-70">
                  FOIA Letters Generated
                </p>
              </div>
              <div className="text-center">
                <p className="font-heading text-4xl lg:text-5xl mb-2">
                  <AnimatedCounter target={2400} suffix="+" />
                </p>
                <p className="text-sm uppercase tracking-wider opacity-70">
                  Agencies Indexed
                </p>
              </div>
              <div className="text-center">
                <p className="font-heading text-4xl lg:text-5xl mb-2">
                  <AnimatedCounter target={89} suffix="%" />
                </p>
                <p className="text-sm uppercase tracking-wider opacity-70">
                  Success Rate
                </p>
              </div>
              <div className="text-center">
                <p className="font-heading text-4xl lg:text-5xl mb-2">
                  <AnimatedCounter target={3} suffix="x" />
                </p>
                <p className="text-sm uppercase tracking-wider opacity-70">
                  Faster Than Manual
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32">
          <div
            ref={ctaReveal.ref}
            className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center animate-scale-in ${ctaReveal.isVisible ? "is-visible" : ""}`}
          >
            <h2 className="font-heading text-4xl lg:text-5xl text-foreground mb-4">
              Ready to file smarter FOIA requests?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Start your 7-day free trial. Cancel anytime.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
