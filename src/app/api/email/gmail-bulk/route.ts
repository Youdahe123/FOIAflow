export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getOAuth2Client, buildRawEmail } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { RequestStatus } from "@/generated/prisma/client";

interface BulkEmailItem {
  agencyId: string;
  subject: string;
  letter: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, description, qualityScore } = (await request.json()) as {
      items: BulkEmailItem[];
      description: string;
      qualityScore?: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 agencies per batch" },
        { status: 400 }
      );
    }

    // Get stored Google tokens
    const account = await prisma.googleAccount.findUnique({
      where: { userId: user.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No Google account connected" },
        { status: 400 }
      );
    }

    const client = getOAuth2Client();
    client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.tokenExpiry.getTime(),
    });

    // Auto-refresh if expired
    if (account.tokenExpiry.getTime() < Date.now()) {
      const { credentials } = await client.refreshAccessToken();
      await prisma.googleAccount.update({
        where: { userId: user.id },
        data: {
          accessToken: credentials.access_token!,
          tokenExpiry: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
        },
      });
      client.setCredentials(credentials);
    }

    const gmail = google.gmail({ version: "v1", auth: client });

    // Fetch all agencies
    const agencyIds = items.map((i) => i.agencyId);
    const agencies = await prisma.agency.findMany({
      where: { id: { in: agencyIds } },
    });
    const agencyMap = new Map(agencies.map((a) => [a.id, a]));

    const results: {
      agencyId: string;
      agencyName: string;
      email: string;
      messageId: string | null;
      status: "sent" | "failed";
      error?: string;
    }[] = [];
    const skipped: { agencyId: string; reason: string }[] = [];

    // Send each email sequentially to avoid Gmail rate limits
    for (const item of items) {
      const agency = agencyMap.get(item.agencyId);
      if (!agency) {
        skipped.push({ agencyId: item.agencyId, reason: "Agency not found" });
        continue;
      }
      if (!agency.foiaEmail) {
        skipped.push({
          agencyId: item.agencyId,
          reason: `${agency.name} has no FOIA email on file`,
        });
        continue;
      }

      try {
        const raw = buildRawEmail({
          from: account.googleEmail,
          to: agency.foiaEmail,
          subject: item.subject,
          body: item.letter,
        });

        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw },
        });

        results.push({
          agencyId: item.agencyId,
          agencyName: agency.name,
          email: agency.foiaEmail,
          messageId: result.data.id ?? null,
          status: "sent",
        });
      } catch (err) {
        results.push({
          agencyId: item.agencyId,
          agencyName: agency.name,
          email: agency.foiaEmail,
          messageId: null,
          status: "failed",
          error: err instanceof Error ? err.message : "Send failed",
        });
      }
    }

    // Create request records for sent emails
    const sentItems = results.filter((r) => r.status === "sent");
    if (sentItems.length > 0) {
      const requestsData = sentItems.map((r) => {
        const item = items.find((i) => i.agencyId === r.agencyId)!;
        return {
          userId: user.id,
          title: description.slice(0, 60),
          subject: item.subject,
          description,
          generatedLetter: item.letter,
          agencyId: r.agencyId,
          status: "FILED" as RequestStatus,
          qualityScore: qualityScore ?? null,
          filedAt: new Date(),
        };
      });

      await prisma.request.createMany({ data: requestsData });

      await prisma.activity.create({
        data: {
          userId: user.id,
          action: "bulk_filed_requests_gmail",
          metadata: {
            count: sentItems.length,
            agencies: sentItems.map((r) => r.agencyName),
            sentFrom: account.googleEmail,
          },
        },
      });
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length + skipped.length,
      sentFrom: account.googleEmail,
      results,
      skipped,
    });
  } catch (error) {
    console.error("Gmail bulk send error:", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails via Gmail" },
      { status: 500 }
    );
  }
}
