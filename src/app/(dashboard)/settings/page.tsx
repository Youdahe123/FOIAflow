"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl py-16 text-center text-muted-foreground">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Google account state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const googleStatus = searchParams.get("google");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setFullName(user.user_metadata?.full_name ?? "");
        setOrganization(user.user_metadata?.organization ?? "");
      }
      setLoading(false);
    });

    // Fetch Google connection status
    fetch("/api/google/status")
      .then((res) => res.json())
      .then((data) => {
        setGoogleConnected(data.connected);
        setGoogleEmail(data.email);
      })
      .catch(() => {})
      .finally(() => setGoogleLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { full_name: fullName, organization },
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="max-w-3xl py-16 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, subscription, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input label="Email" value={email} disabled />
          <Input
            label="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription</CardTitle>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing through the Stripe customer portal.
          </p>
        </CardContent>
        <CardFooter className="gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await fetch("/api/stripe/portal", { method: "POST" });
              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              } else {
                window.location.href = "/pricing";
              }
            }}
          >
            Manage Billing
          </Button>
        </CardFooter>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google status banner */}
          {googleStatus === "connected" && (
            <div className="bg-success/10 border border-success/20 text-success px-3 py-2 text-sm">
              Google account connected successfully.
            </div>
          )}
          {googleStatus === "error" && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-3 py-2 text-sm">
              Failed to connect Google account. Please try again.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Google Account
                </p>
                {googleLoading ? (
                  <p className="text-xs text-muted-foreground">Checking...</p>
                ) : googleConnected ? (
                  <p className="text-xs text-muted-foreground">
                    {googleEmail} — FOIA emails will be sent from this account
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Connect to send FOIA requests directly from your Gmail
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleConnected && (
                <Badge variant="success" size="sm">Connected</Badge>
              )}
              {googleConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setGoogleConnecting(true);
                    try {
                      await fetch("/api/google/disconnect", { method: "POST" });
                      setGoogleConnected(false);
                      setGoogleEmail(null);
                    } finally {
                      setGoogleConnecting(false);
                    }
                  }}
                  disabled={googleConnecting}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    setGoogleConnecting(true);
                    try {
                      const res = await fetch("/api/google/connect", { method: "POST" });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } finally {
                      setGoogleConnecting(false);
                    }
                  }}
                  disabled={googleConnecting || googleLoading}
                >
                  {googleConnecting ? "Connecting..." : "Connect Google"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "Request status updates",
              description: "Get notified when your FOIA request status changes",
              enabled: true,
            },
            {
              label: "Deadline reminders",
              description: "Receive reminders before statutory deadlines",
              enabled: true,
            },
            {
              label: "Document analysis complete",
              description: "Get notified when document analysis finishes",
              enabled: true,
            },
            {
              label: "Weekly digest",
              description: "Summary of your request activity each week",
              enabled: false,
            },
          ].map((notification) => (
            <NotificationRow key={notification.label} {...notification} />
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Export All Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your requests, documents, and account data.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Export
            </Button>
          </div>
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationRow({
  label,
  description,
  enabled: initialEnabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);

  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border-2 border-transparent transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 bg-white transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
