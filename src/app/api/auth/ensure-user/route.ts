import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = user.email === "youdaheasfaw@gmail.com";
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: isAdmin ? { role: "ADMIN" } : {},
      create: {
        supabaseId: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        role: isAdmin ? "ADMIN" : "JOURNALIST",
      },
    });

    return NextResponse.json({ ok: true, subscriptionTier: dbUser.subscriptionTier });
  } catch (error) {
    console.error("Ensure user error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
