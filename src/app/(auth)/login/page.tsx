"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preserve plan selection across login redirect
  const planParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("plan")
    : null;
  const pricingUrl = planParam ? `/pricing?plan=${encodeURIComponent(planParam)}` : "/pricing";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Ensure user exists in the database
    if (data.user) {
      const res = await fetch("/api/auth/ensure-user", { method: "POST" });
      const userData = await res.json();
      // Admin goes to admin page
      if (data.user.email === "youdaheasfaw@gmail.com") {
        router.push("/admin");
      } else if (userData.subscriptionTier && userData.subscriptionTier !== "FREE_TRIAL") {
        router.push("/dashboard");
      } else {
        router.push(pricingUrl);
      }
    } else {
      router.push(pricingUrl);
    }
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const callbackUrl = planParam
      ? `${window.location.origin}/callback?next=${encodeURIComponent(pricingUrl)}`
      : `${window.location.origin}/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-foreground mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Access your FOIA dashboard
      </p>

      {error && (
        <div className="mb-4 border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@newsroom.com"
            className="block h-10 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="block h-10 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
