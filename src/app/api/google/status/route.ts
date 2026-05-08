export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
    select: { googleEmail: true, connectedAt: true },
  });

  return NextResponse.json({
    connected: !!account,
    email: account?.googleEmail ?? null,
    connectedAt: account?.connectedAt?.toISOString() ?? null,
  });
}
