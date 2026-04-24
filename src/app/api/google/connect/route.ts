export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getAuthUrl();
  return NextResponse.json({ url });
}
