import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getOAuth2Client, buildRawEmail } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and body" },
        { status: 400 }
      );
    }

    // Get stored Google tokens
    const account = await prisma.googleAccount.findUnique({
      where: { userId: user.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No Google account connected. Connect one in Settings." },
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

    const raw = buildRawEmail({
      from: account.googleEmail,
      to,
      subject,
      body,
    });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    // Create notification for successful send
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "FOIA Request Sent",
        message: `Your request "${subject}" was sent to ${to}`,
        type: "success",
        link: "/tracker",
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.data.id,
      threadId: result.data.threadId,
    });
  } catch (error: unknown) {
    console.error("Gmail send error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send via Gmail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
