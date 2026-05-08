export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "15", 10);

    const data = await prisma.activity.findMany({
      where: { userId: user.id },
      include: {
        request: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      data: data.map((a) => ({
        id: a.id,
        userId: a.userId,
        action: a.action,
        description: (a.metadata as Record<string, string> | null)?.description ?? "",
        requestId: a.requestId,
        requestTitle: a.request?.title ?? "",
        targetTitle: a.request?.title ?? "",
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
        timestamp: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
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
    const { action, description, requestId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    await prisma.activity.create({
      data: {
        userId: user.id,
        requestId: requestId || null,
        action,
        metadata: description ? { description } : undefined,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
