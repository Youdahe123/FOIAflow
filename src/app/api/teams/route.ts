export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
        },
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        members: t.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role.toLowerCase(),
          joinedAt: m.joinedAt.toISOString(),
          fullName: m.user.fullName,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        })),
        requestCount: t._count.requests,
        createdAt: t.createdAt.toISOString(),
      })),
      total: teams.length,
    });
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          createdAt: team.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
