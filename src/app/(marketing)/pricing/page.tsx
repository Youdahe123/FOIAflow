"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { pricingPlans } from "@/data/pricing-plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/* ========================================================================== */
/*  Comparison table data                                                      */
/* ========================================================================== */

type CellValue = string | boolean;

interface ComparisonRow {
  feature: string;
  starter: CellValue;
  pro: CellValue;
  newsroom: CellValue;
}

const comparisonRows: ComparisonRow[] = [
  {
    feature: "FOIA requests / month",
    starter: "10",
    pro: "50",
    newsroom: "Unlimited",
  },
  {
    feature: "AI letter generation",
    starter: true,
    pro: true,
    newsroom: true,
  },
  {
    feature: "Appeal generation",
    starter: true,
    pro: true,
    newsroom: true,
  },
  {
    feature: "Document analyses / month",
    starter: "5",
    pro: "25",
    newsroom: "Unlimited",
  },
  {
    feature: "Agency comparison",
    starter: false,
    pro: true,
    newsroom: true,
  },
  {
    feature: "Team members",
    starter: "1",
    pro: "1",
    newsroom: "10",
  },
  {
    feature: "Priority support",
    starter: false,
    pro: true,
    newsroom: true,
  },
  {
    feature: "API access",
    starter: false,
    pro: false,
    newsroom: true,
  },
];

/* ========================================================================== */
/*  FAQ data                                                                   */
/* ========================================================================== */

const faqs = [
  {
    question: "Can I switch plans?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference for the remainder of the billing cycle. Downgrades take effect at the start of your next billing period.",
  },
  {
    question: "What happens after my trial?",
    answer:
      "Your 7-day free trial starts when you sign up and choose a plan. You'll enter a credit card but won't be charged until the trial ends. Cancel anytime before then and you won't be charged.",
  },
  {
    question: "Is there a contract?",
    answer:
      "No. All plans are month-to-month with no long-term commitment. You can cancel at any time, and your access continues through the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) processed securely through Stripe. For Newsroom plans, we also offer invoicing and purchase orders for institutional billing.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer a full refund within the first 14 days of any paid subscription. After that, you can cancel at any time but refunds are not available for partial billing periods.",
  },
  {
    question: "Do you offer discounts for nonprofit newsrooms?",
    answer:
      "Yes. We offer a 30% discount for verified nonprofit news organizations and independent journalists. Contact us at press@flowai.com with proof of nonprofit status to apply.",
  },
];

/* ========================================================================== */
/*  Helper: render cell value                                                  */
/* ========================================================================== */

function CellDisplay({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        className="text-primary mx-auto"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <span className="text-muted-foreground">&mdash;</span>
    );
  }
  return <span>{value}</span>;
}

/* ========================================================================== */
/*  Page                                                                       */
/* ========================================================================== */

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

  async function startCheckout(planId: string, planName: string) {
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

  async function handleSubscribe(planId: string, planName: string) {
    if (!userId) {
      // Redirect to login with plan info so we can auto-checkout after auth
      window.location.href = `/login?plan=${encodeURIComponent(planId)}`;
      return;
    }
    startCheckout(planId, planName);
  }

  // Auto-trigger checkout if redirected back with a plan param after login
  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    const planId = params.get("plan");
    if (planId) {
      const plan = pricingPlans.find((p) => p.stripePriceId === planId);
      if (plan) {
        // Clean the URL
        window.history.replaceState({}, "", "/pricing");
        startCheckout(planId, plan.name);
      }
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const plans = pricingPlans.filter((p) => p.id !== "free_trial");

  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/*  Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-5xl text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a free 7-day trial. Cancel anytime.
          </p>
        </div>

        <div className="bg-accent border border-border p-4 text-center mb-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-foreground font-medium">
            Try Snowden free for 7 days. Card required to start trial.
          </p>
          <Button variant="primary" size="sm" asChild>
            <Link href="/signup">Start Free Trial</Link>
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Pricing cards                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-24">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "border bg-surface flex flex-col",
                plan.popular
                  ? "border-2 border-primary relative"
                  : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-px left-0 right-0 flex justify-center -translate-y-full">
                  <Badge variant="primary" className="translate-y-1/2">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                {/* Plan name */}
                <h3 className="font-heading text-2xl text-foreground mb-4">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-heading text-5xl text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="square"
                        className="text-primary flex-shrink-0 mt-0.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.popular ? "primary" : "outline"}
                  size="lg"
                  className="w-full"
                  onClick={() => handleSubscribe(plan.stripePriceId, plan.name)}
                >
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  Comparison table                                                 */}
        {/* ---------------------------------------------------------------- */}
        <div className="max-w-5xl mx-auto mb-24">
          <h2 className="font-heading text-3xl text-foreground text-center mb-10">
            Compare plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-4 pr-4 font-medium text-muted-foreground w-[40%]">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">
                    Starter
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-foreground bg-primary/5">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 font-medium text-muted-foreground">
                    Newsroom
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-border">
                    <td className="py-4 pr-4 text-foreground">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-foreground">
                      <CellDisplay value={row.starter} />
                    </td>
                    <td className="py-4 px-4 text-center text-foreground bg-primary/5">
                      <CellDisplay value={row.pro} />
                    </td>
                    <td className="py-4 px-4 text-center text-foreground">
                      <CellDisplay value={row.newsroom} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*  FAQ                                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl text-foreground text-center mb-10">
            Frequently asked questions
          </h2>

          <div className="divide-y divide-border border-t border-border">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between py-5 text-left transition-colors hover:text-primary"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-foreground pr-4">
                      {faq.question}
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                      className={cn(
                        "flex-shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      isOpen ? "max-h-96 pb-5" : "max-h-0"
                    )}
                  >
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
