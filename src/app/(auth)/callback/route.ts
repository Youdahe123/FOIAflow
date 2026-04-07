import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pricing";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user exists in Prisma DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
        const dest = dbUser.role === "ADMIN" ? "/admin" : dbUser.subscriptionTier !== "FREE_TRIAL" ? "/dashboard" : "/pricing";
        return NextResponse.redirect(`${origin}${dest}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
