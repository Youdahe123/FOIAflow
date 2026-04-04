import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Fetch all agencies in one query
    const agencyIds = items.map((i) => i.agencyId);
    const agencies = await prisma.agency.findMany({
      where: { id: { in: agencyIds } },
    });

    const agencyMap = new Map(agencies.map((a) => [a.id, a]));

    // Build emails — skip agencies with no foiaEmail
    const emailPayloads: {
      from: string;
      to: string[];
      subject: string;
      text: string;
      agencyId: string;
    }[] = [];

    const skipped: { agencyId: string; reason: string }[] = [];

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

      emailPayloads.push({
        from: "FOIAflow <noreply@foiaflow.app>",
        to: [agency.foiaEmail],
        subject: item.subject,
        text: item.letter,
        agencyId: item.agencyId,
      });
    }

    // Send via Resend batch API (up to 100 per call)
    const resend = getResend();
    const results: {
      agencyId: string;
      agencyName: string;
      email: string;
      messageId: string | null;
      status: "sent" | "failed";
      error?: string;
    }[] = [];

    if (emailPayloads.length > 0) {
      const batchPayload = emailPayloads.map(({ from, to, subject, text }) => ({
        from,
        to,
        subject,
        text,
      }));

      const { data, error } = await resend.batch.send(batchPayload);

      if (error) {
        console.error("Resend batch error:", error);
        // Mark all as failed
        for (const payload of emailPayloads) {
          const agency = agencyMap.get(payload.agencyId)!;
          results.push({
            agencyId: payload.agencyId,
            agencyName: agency.name,
            email: agency.foiaEmail!,
            messageId: null,
            status: "failed",
            error: error.message,
          });
        }
      } else {
        // Map results back to agencies
        const batchData = data?.data ?? [];
        for (let i = 0; i < emailPayloads.length; i++) {
          const payload = emailPayloads[i];
          const agency = agencyMap.get(payload.agencyId)!;
          const emailResult = batchData[i];
          results.push({
            agencyId: payload.agencyId,
            agencyName: agency.name,
            email: agency.foiaEmail!,
            messageId: emailResult?.id ?? null,
            status: emailResult?.id ? "sent" : "failed",
          });
        }
      }
    }

    // Create request records for successfully sent emails
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

      // Log activity
      await prisma.activity.create({
        data: {
          userId: user.id,
          action: "bulk_filed_requests",
          metadata: {
            count: sentItems.length,
            agencies: sentItems.map((r) => r.agencyName),
          },
        },
      });
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length + skipped.length,
      results,
      skipped,
    });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}
