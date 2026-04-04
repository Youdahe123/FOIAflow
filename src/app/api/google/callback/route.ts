import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getOAuth2Client } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/settings?google=error`);
    }

    // Get user's Google email
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: profile } = await oauth2.userinfo.get();
    const googleEmail = profile.email ?? user.email;

    // Store tokens
    await prisma.googleAccount.upsert({
      where: { userId: user.id },
      update: {
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
      },
      create: {
        userId: user.id,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
      },
    });

    return NextResponse.redirect(`${origin}/settings?google=connected`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }
}
