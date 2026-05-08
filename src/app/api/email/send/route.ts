export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, from } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and body" },
        { status: 400 }
      );
    }

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: from ?? "Snowden <noreply@Snowden.app>",
      to: [to],
      subject,
      text: body,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id ?? null,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
