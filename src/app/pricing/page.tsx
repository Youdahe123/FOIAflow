"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { pricingPlans } from "@/data/pricing-plans";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/* ==========================================================================
   FAQ Item
   ========================================================================== */

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          padding: "22px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-heading)",
          fontSize: 18,
          fontWeight: 700,
          color: "#FFF",
          transition: "color 0.2s",
        }}
        className="pricing-faq-q"
      >
        {question}
        <span
          style={{
            fontSize: 22,
            color: "#CC2222",
            flexShrink: 0,
            transition: "transform 0.3s",
            lineHeight: 1,
            transform: open ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.45s ease, padding-bottom 0.3s",
          paddingBottom: open ? 24 : 0,
          fontSize: 14,
          fontWeight: 300,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.85,
          fontFamily: "var(--font-body)",
        }}
      >
        {answer}
      </div>
    </div>
  );
}

/* ==========================================================================
   Comparison table data
   ========================================================================== */

type CellValue = string | boolean;

interface ComparisonRow {
  feature: string;
  starter: CellValue;
  pro: CellValue;
  newsroom: CellValue;
}

const comparisonRows: ComparisonRow[] = [
  { feature: "FOIA requests / month", starter: "10", pro: "50", newsroom: "Unlimited" },
  { feature: "AI letter generation", starter: true, pro: true, newsroom: true },
  { feature: "Appeal generation", starter: true, pro: true, newsroom: true },
  { feature: "Document analyses / month", starter: "5", pro: "25", newsroom: "Unlimited" },
  { feature: "Agency comparison", starter: false, pro: true, newsroom: true },
  { feature: "Team members", starter: "1", pro: "1", newsroom: "10" },
  { feature: "Priority support", starter: false, pro: true, newsroom: true },
  { feature: "API access", starter: false, pro: false, newsroom: true },
];

function CellDisplay({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CC2222" strokeWidth="2.5" strokeLinecap="square">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <span style={{ color: "rgba(255,255,255,0.2)" }}>&mdash;</span>
    );
  }
  return <span>{value}</span>;
}

/* ==========================================================================
   FAQ data
   ========================================================================== */

const faqs = [
  {
    question: "Can I switch plans?",
    answer: "Yes. You can upgrade or downgrade at any time. Upgrades are prorated. Downgrades take effect at the start of your next billing period.",
  },
  {
    question: "What happens after my trial?",
    answer: "Your 7-day free trial starts when you sign up and choose a plan. You won't be charged until the trial ends. Cancel anytime before then.",
  },
  {
    question: "Is there a contract?",
    answer: "No. All plans are month-to-month. Cancel anytime, and your access continues through the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "All major credit cards (Visa, Mastercard, American Express) processed securely through Stripe. Newsroom plans also support invoicing and purchase orders.",
  },
  {
    question: "Do you offer discounts for nonprofit newsrooms?",
    answer: "Yes. 30% discount for verified nonprofit news organizations and independent journalists. Contact us with proof of nonprofit status to apply.",
  },
];

/* ==========================================================================
   Page
   ========================================================================== */

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Scroll reveal
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

  async function handleSubscribe(planId: string, planName: string) {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: planId, userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout",
          description: `Stripe checkout for ${planName} plan — configure STRIPE_SECRET_KEY to enable.`,
          variant: "info",
        });
      }
    } catch {
      toast({
        title: "Checkout",
        description: `Stripe checkout for ${planName} plan — configure STRIPE_SECRET_KEY to enable.`,
        variant: "info",
      });
    }
  }

  const plans = pricingPlans.filter((p) => p.id !== "free_trial");

  return (
    <div className="lp" style={{ minHeight: "100vh" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <Link href="/" className="lp-nav-logo">
          FOIA<span>flow</span>
        </Link>
        <div className="lp-nav-links">
          <Link href="/#problem">The Problem</Link>
          <Link href="/#kill">Why FOIAflow</Link>
          <Link href="/pricing" style={{ color: "#FFF" }}>Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/login">Log In</Link>
          <Link href="/signup" className="lp-nav-cta">
            Start Now
          </Link>
        </div>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <section style={{ paddingTop: "18vh", paddingBottom: "8vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", textAlign: "center" }}>
          <p className="lp-reveal" style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#8B1A1A", marginBottom: 24, fontFamily: "var(--font-body)" }}>
            Pricing
          </p>
          <h1 className="lp-reveal" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#FFF", letterSpacing: -3, lineHeight: 0.95, marginBottom: 24 }}>
            Simple, <em style={{ fontStyle: "italic", color: "#CC2222" }}>transparent</em><br />pricing.
          </h1>
          <p className="lp-reveal" style={{ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, maxWidth: 460, margin: "0 auto 48px", fontFamily: "var(--font-body)" }}>
            Start with a 7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ───────────────────────────────────────────── */}
      <section style={{ paddingBottom: "10vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 0 }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="lp-reveal"
                style={{
                  background: plan.popular ? "#FFF" : "#FAFAF8",
                  padding: "48px 40px",
                  border: plan.popular ? "2px solid #CC2222" : "1px solid #E8E8E8",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 32,
                    background: "#CC2222",
                    color: "#FFF",
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    transform: "translateY(-50%)",
                  }}>
                    Most Popular
                  </div>
                )}

                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 900, color: "#0A0A0A", marginBottom: 8 }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: 32 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: 56, fontWeight: 900, color: plan.popular ? "#CC2222" : "#0A0A0A", lineHeight: 1 }}>
                    ${plan.price}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 300, color: "#888880", marginLeft: 4 }}>/month</span>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, marginBottom: 32 }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 12,
                        fontSize: 13,
                        fontWeight: 300,
                        color: "#333330",
                        lineHeight: 1.65,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CC2222" strokeWidth="2.5" strokeLinecap="square" style={{ flexShrink: 0, marginTop: 2 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.stripePriceId, plan.name)}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: "var(--font-body)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    background: plan.popular ? "#6B0000" : "#0A0A0A",
                    color: "#FFF",
                  }}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────── */}
      <section style={{ paddingBottom: "10vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
          <h2 className="lp-reveal" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#FFF", letterSpacing: -2, textAlign: "center", marginBottom: 48 }}>
            Compare plans
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.15)" }}>
                  <th style={{ textAlign: "left", padding: "16px 16px 16px 0", fontWeight: 400, color: "rgba(255,255,255,0.4)", width: "40%" }}>Feature</th>
                  <th style={{ textAlign: "center", padding: 16, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>Starter</th>
                  <th style={{ textAlign: "center", padding: 16, fontWeight: 600, color: "#CC2222" }}>Pro</th>
                  <th style={{ textAlign: "center", padding: 16, fontWeight: 500, color: "rgba(255,255,255,0.65)" }}>Newsroom</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "14px 16px 14px 0", color: "rgba(255,255,255,0.75)" }}>{row.feature}</td>
                    <td style={{ padding: 14, textAlign: "center", color: "rgba(255,255,255,0.75)" }}><CellDisplay value={row.starter} /></td>
                    <td style={{ padding: 14, textAlign: "center", color: "#FFF", background: "rgba(204,34,34,0.05)" }}><CellDisplay value={row.pro} /></td>
                    <td style={{ padding: 14, textAlign: "center", color: "rgba(255,255,255,0.75)" }}><CellDisplay value={row.newsroom} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section style={{ paddingBottom: "12vh" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", padding: "0 40px" }}>
          <p className="lp-sec-label lp-reveal">FAQ</p>
          <h2 className="lp-reveal" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#FFF", letterSpacing: -2, marginBottom: 48 }}>
            Pricing questions
          </h2>

          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
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
