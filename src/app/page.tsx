"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/* ==========================================================================
   Scroll reveal hook
   ========================================================================== */

function useReveal(threshold = 0.1) {
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
   FAQ Item
   ========================================================================== */

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lp-faq-item">
      <button className="lp-faq-q" onClick={() => setOpen(!open)}>
        {question}
        <span className={`lp-faq-icon ${open ? "open" : ""}`}>+</span>
      </button>
      <div className={`lp-faq-a ${open ? "open" : ""}`}>{answer}</div>
    </div>
  );
}

/* ==========================================================================
   Process panels data
   ========================================================================== */

const processPanels = [
  {
    num: "01",
    label: "How it works · 01 of 04",
    h2: (
      <>
        Type what
        <br />
        you&apos;re <em>investigating.</em>
      </>
    ),
    body: "Describe your investigation in plain language. FOIAflow identifies the right agencies, the right contacts, and the optimal request strategy automatically. No forms. No research. Just a sentence.",
    tag: "Autonomous · Zero manual input required",
  },
  {
    num: "02",
    label: "How it works · 02 of 04",
    h2: (
      <>
        AI drafts and
        <br />
        <em>files</em> the request.
      </>
    ),
    body: "A legally precise FOIA letter citing 5 USC 552 with journalist fee waiver language, expedited processing justification, pre-loaded exemption defenses, and optimal routing to the correct office. Filed automatically.",
    tag: "Auto-file · Auto-route · Auto-fee-waiver",
  },
  {
    num: "03",
    label: "How it works · 03 of 04",
    h2: (
      <>
        The agent follows
        <br />
        up <em>relentlessly.</em>
      </>
    ),
    body: "Follow-ups at day 20, 40, and 60. Legal pressure letters when agencies miss their deadline. Automatic appeals the moment a denial arrives — with AI counter-arguments targeting the specific exemption claimed.",
    tag: "Auto-followup · Auto-appeal · Auto-escalate",
  },
  {
    num: "04",
    label: "How it works · 04 of 04",
    h2: (
      <>
        Documents arrive.
        <br />
        We <em>read them.</em>
      </>
    ),
    body: "Upload returned documents and the AI extracts the story — executive summary, newsworthiness score, named entities, redaction detection with legal challenges, and the five most publishable quotes pulled and formatted.",
    tag: "Auto-analyze · Auto-extract · Auto-challenge-redactions",
  },
];

/* ==========================================================================
   Ticker data
   ========================================================================== */

const tickerItems = [
  "DOJ avg response: 187 days",
  "ICE denial rate: 62%",
  "Only 3% of denials are ever appealed — 40% of those win",
  "94% of agencies miss the legal deadline",
  "NSA avg response: 72 days",
  "One nonprofit billed $1.2M for a single records request",
];

/* ==========================================================================
   Page
   ========================================================================== */

export default function HomePage() {
  const processOuterRef = useRef<HTMLDivElement>(null);
  const processTrackRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(0);

  // Scroll-driven horizontal process section
  const lastPanelRef = useRef(0);
  const handleScroll = useCallback(() => {
    const outer = processOuterRef.current;
    const track = processTrackRef.current;
    if (!outer || !track) return;

    const rect = outer.getBoundingClientRect();
    const totalScroll = outer.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / totalScroll));
    const offset = progress * (processPanels.length - 1) * 100;
    track.style.transform = `translateX(-${offset}vw)`;

    const newPanel = Math.round(progress * (processPanels.length - 1));
    if (newPanel !== lastPanelRef.current) {
      lastPanelRef.current = newPanel;
      setActivePanel(newPanel);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll reveal for elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <Link href="/" className="lp-nav-logo">
          FOIA<span>flow</span>
        </Link>
        <div className="lp-nav-links">
          <a href="#problem">The Problem</a>
          <a href="#kill">Why FOIAflow</a>
          <Link href="/pricing">Pricing</Link>
          <a href="#faq">FAQ</a>
          <Link href="/login">Log In</Link>
          <Link href="/signup" className="lp-nav-cta">
            Start Now
          </Link>
        </div>
      </nav>

      {/* ── Ticker ──────────────────────────────────────────────────── */}
      <div className="lp-ticker">
        <div className="lp-ticker-inner">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="lp-tick">
              <span className="lp-tdot" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="lp-hero-bg"
          src="/hero-bg.jpg"
          alt=""
        />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <p className="lp-hero-eyebrow">AI-powered public records automation</p>
          <h1 className="lp-hero-h1">
            Unlock
            <br />
            <em>the</em>
            <br />
            Record.
          </h1>
          <p className="lp-hero-sub">
            The first fully autonomous FOIA agent. Type a topic. We file, follow
            up, appeal, and analyze the documents — without you lifting a finger.
          </p>
          <div className="lp-hero-btns">
            <Link href="/signup" className="lp-btn-white">
              Get Started
            </Link>
            <a href="#process" className="lp-btn-ghost">
              See The Workflow
            </a>
          </div>
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────────────────── */}
      <section
        className="lp-problem"
        id="problem"
      >
        <div className="lp-prob-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-bg.jpg" alt="" />
        </div>
        <div className="lp-prob-text">
          <p className="lp-sec-label lp-reveal">The problem</p>
          <h2 className="lp-sec-h2 lp-reveal">
            The FOIA process
            <br />
            is <em>broken.</em>
          </h2>

          <div className="lp-pain-item lp-reveal d1">
            <div className="lp-pain-n">01 :</div>
            <div className="lp-pain-t">Deadlines slip through the cracks</div>
            <p className="lp-pain-b">
              Twenty business days. That&apos;s federal law. 94% of agencies
              ignore it. Most journalists never notice until the story is cold.
            </p>
          </div>
          <div className="lp-pain-item lp-reveal d2">
            <div className="lp-pain-n">02 :</div>
            <div className="lp-pain-t">
              Only 3% of denials are ever appealed
            </div>
            <p className="lp-pain-b">
              Yet 40% of those appeals succeed. Journalists leave records on the
              table because no tool automates the pushback.
            </p>
          </div>
          <div className="lp-pain-item lp-reveal d3">
            <div className="lp-pain-n">03 :</div>
            <div className="lp-pain-t">
              Agencies weaponize fees to kill requests
            </div>
            <p className="lp-pain-b">
              One nonprofit was billed $1.2 million. One journalist brought a
              $2,800 fee down to $29 with the right language. FOIAflow writes
              that language on every request.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works (horizontal scroll) ────────────────────────── */}
      <div
        className="lp-process-outer"
        id="process"
        ref={processOuterRef}
        style={{ height: "500vh" }}
      >
        <div className="lp-process-sticky">
          <div className="lp-process-track" ref={processTrackRef}>
            {processPanels.map((panel, i) => (
              <div key={panel.num} className="lp-process-panel">
                <div>
                  <p className="lp-process-label">{panel.label}</p>
                  <h2 className="lp-process-h2">{panel.h2}</h2>
                  <p className="lp-process-body">{panel.body}</p>
                  <div className="lp-process-tag">{panel.tag}</div>
                </div>
                <div className="lp-process-bg-num">{panel.num}</div>
                <div className="lp-process-progress">
                  {processPanels.map((_, j) => (
                    <div
                      key={j}
                      className={`lp-prog-line ${activePanel === j ? "active" : ""}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quote ───────────────────────────────────────────────────── */}
      <section className="lp-quote-sec">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lp-quote-bg" src="/hero-bg.jpg" alt="" />
        <div className="lp-quote-overlay" />
        <div className="lp-quote-content lp-reveal">
          <p className="lp-pull-q">
            &ldquo;I filed 47 FOIA requests last year. I tracked them in a
            Google Sheet{" "}
            <strong>I hated and barely understood.</strong>&rdquo;
          </p>
          <p className="lp-pull-attr">
            — Investigative reporter, major US daily
          </p>
        </div>
      </section>

      {/* ── Why FOIAflow ────────────────────────────────────────────── */}
      <section className="lp-kill" id="kill">
        <div className="lp-kill-left">
          <div className="lp-kill-badge lp-reveal">Why FOIAflow</div>
          <h2 className="lp-kill-h lp-reveal">
            Other tools help you file.
            <br />
            We <em>fight for you.</em>
          </h2>
          <p className="lp-kill-body lp-reveal">
            Existing tools are filing services. FOIAflow is an autonomous agent
            that files, follows up, appeals denials, negotiates fees, and
            analyzes every document — at a flat monthly rate.
          </p>
          <Link href="/signup" className="lp-btn-white lp-reveal" style={{ alignSelf: "flex-start" }}>
            Start Free Trial
          </Link>
        </div>
        <div className="lp-kill-right">
          <div className="lp-kill-stat lp-reveal d1">
            <div className="lp-kill-num">40%</div>
            <div>
              <div className="lp-kill-stat-label">The appeal gap</div>
              <p className="lp-kill-stat-body">
                of FOIA appeals succeed — but only 3% are ever filed. FOIAflow
                appeals every denial automatically the moment it arrives.
              </p>
            </div>
          </div>
          <div className="lp-kill-stat lp-reveal d2">
            <div className="lp-kill-num">$29</div>
            <div>
              <div className="lp-kill-stat-label">The fee gap</div>
              <p className="lp-kill-stat-body">
                One Bloomberg reporter brought a $2,800 fee down to $29 with the
                right language. FOIAflow adds that language to every single
                request.
              </p>
            </div>
          </div>
          <div className="lp-kill-stat lp-reveal d3">
            <div className="lp-kill-num">94%</div>
            <div>
              <div className="lp-kill-stat-label">Agencies miss deadlines</div>
              <p className="lp-kill-stat-body">
                Federal law says 20 business days. Almost no one complies.
                FOIAflow sends automated follow-ups and legal pressure letters on
                every missed deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="lp-faq-sec" id="faq">
        <div className="lp-faq-inner">
          <p className="lp-sec-label lp-reveal">FAQ</p>
          <h2 className="lp-faq-h lp-reveal">
            Everything you need
            <br />
            to know.
          </h2>
          <p className="lp-faq-sub lp-reveal">Common questions about FOIAflow.</p>

          <FaqItem
            question="What exactly does FOIAflow automate?"
            answer={
              <>
                Everything. You type an investigation topic. FOIAflow identifies
                agencies, drafts a legally precise request with fee waiver
                language, files it, sends follow-ups at day 20/40/60,
                auto-drafts and files an appeal the moment a denial arrives, and
                fully analyzes every document you receive.{" "}
                <strong>You type a sentence. We do the rest.</strong>
              </>
            }
          />
          <FaqItem
            question="How is this different from other FOIA tools?"
            answer={
              <>
                Most tools are filing services — they help you submit requests.{" "}
                <strong>FOIAflow is an autonomous agent.</strong> We handle the
                entire lifecycle: filing, follow-ups, appeals, fee negotiation,
                and document analysis. Flat monthly pricing, unlimited requests.
              </>
            }
          />
          <FaqItem
            question="Why do only 3% of denials get appealed?"
            answer={
              <>
                Because appealing is manual, time-consuming, and requires legal
                knowledge most journalists don&apos;t have. Yet{" "}
                <strong>40% of those appeals succeed.</strong> FOIAflow pushes
                back automatically on every denial, targeting the specific legal
                weakness in whichever exemption the agency cited.
              </>
            }
          />
          <FaqItem
            question="What is the fee negotiation feature?"
            answer={
              <>
                Agencies routinely use excessive fee estimates to discourage
                requests. A Bloomberg reporter proved you can bring a $2,800 fee
                down to $29 with the right language.{" "}
                <strong>
                  FOIAflow automatically appends optimized fee waiver language
                </strong>{" "}
                to every request, citing your journalist status, publication, and
                public interest value.
              </>
            }
          />
          <FaqItem
            question="Does FOIAflow cover state and local requests?"
            answer={
              <>
                Yes. FOIAflow covers federal FOIA (5 USC 552) and all 50 state
                public records laws. Each state has different deadlines,
                exemptions, and fee structures —{" "}
                <strong>
                  FOIAflow automatically adjusts request language and follow-up
                  timing based on jurisdiction.
                </strong>
              </>
            }
          />
          <FaqItem
            question="What are the pricing tiers?"
            answer={
              <>
                Check our{" "}
                <Link
                  href="/pricing"
                  style={{ color: "#6B0000", textDecoration: "underline" }}
                >
                  pricing page
                </Link>{" "}
                for current plans. We offer tiers for solo journalists, small
                newsrooms, and enterprise teams.{" "}
                <strong>
                  All plans include unlimited requests and full automation.
                </strong>
              </>
            }
          />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="lp-cta-sec">
        <div className="lp-reveal" style={{ maxWidth: 700 }}>
          <h2 className="lp-cta-h">
            Start unlocking
            <br />
            records today.
          </h2>
          <p className="lp-cta-sub">
            7-day free trial. No credit card required. Full access to every
            feature from day one.
          </p>
          <Link href="/signup" className="lp-cta-btn">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-f-logo">FOIAflow</div>
        <div className="lp-f-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log In</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
        <div className="lp-f-copy">
          &copy; {new Date().getFullYear()} FOIAflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
