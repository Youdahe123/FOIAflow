export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Exclude internal/test accounts from all analytics
  const excludeNames = ["Amanuel Asfaw", "Youdahe Asfaw", "amanuel asfaw", "youdhae asfaw"];
  const excludeFilter = {
    NOT: {
      fullName: { in: excludeNames },
    },
  };
  const excludeUserJoin = {
    user: { NOT: { fullName: { in: excludeNames } } },
  };

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersThisWeek,
    totalRequests,
    requestsThisMonth,
    totalDocuments,
    usersByTier,
    requestsByStatus,
    recentActivities,
    dailySignups,
    dailyRequests,
  ] = await Promise.all([
    prisma.user.count({ where: excludeFilter }),
    prisma.user.count({ where: { ...excludeFilter, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { ...excludeFilter, createdAt: { gte: sevenDaysAgo } } }),
    prisma.request.count({ where: excludeUserJoin }),
    prisma.request.count({ where: { ...excludeUserJoin, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.document.count({ where: excludeUserJoin }),
    prisma.user.groupBy({ by: ["subscriptionTier"], where: excludeFilter, _count: true }),
    prisma.request.groupBy({ by: ["status"], where: excludeUserJoin, _count: true }),
    prisma.activity.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      where: excludeUserJoin,
      include: { user: { select: { email: true, fullName: true } } },
    }),
    // Daily signups over last 30 days (excluding internal accounts)
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo}
        AND (full_name IS NULL OR full_name NOT IN ('Amanuel Asfaw', 'Youdahe Asfaw', 'amanuel asfaw', 'youdhae asfaw'))
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `,
    // Daily requests over last 30 days (excluding internal accounts)
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM requests
      WHERE created_at >= ${thirtyDaysAgo}
        AND user_id NOT IN (
          SELECT id FROM users WHERE full_name IN ('Amanuel Asfaw', 'Youdahe Asfaw', 'amanuel asfaw', 'youdhae asfaw')
        )
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `,
  ]);

  return NextResponse.json({
    data: {
      overview: {
        totalUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        totalRequests,
        requestsThisMonth,
        totalDocuments,
      },
      usersByTier: usersByTier.map((t) => ({
        tier: t.subscriptionTier,
        count: t._count,
      })),
      requestsByStatus: requestsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        userEmail: a.user.email,
        userName: a.user.fullName,
        createdAt: a.createdAt.toISOString(),
      })),
      dailySignups: dailySignups.map((d) => ({
        day: d.day,
        count: Number(d.count),
      })),
      dailyRequests: dailyRequests.map((d) => ({
        day: d.day,
        count: Number(d.count),
      })),
    },
  });
}
