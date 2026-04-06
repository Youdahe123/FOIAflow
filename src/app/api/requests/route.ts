import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { RequestStatus as PrismaStatus } from "@/generated/prisma/client";

const statusToEnum: Record<string, PrismaStatus> = {
  draft: "DRAFT",
  ready_to_file: "READY_TO_FILE",
  filed: "FILED",
  acknowledged: "ACKNOWLEDGED",
  processing: "PROCESSING",
  partial_response: "PARTIAL_RESPONSE",
  completed: "COMPLETED",
  denied: "DENIED",
  appealed: "APPEALED",
  appeal_pending: "APPEAL_PENDING",
  overdue: "OVERDUE",
};

function statusToFrontend(s: PrismaStatus): string {
  return s.toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const agencyId = searchParams.get("agencyId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const where: Record<string, unknown> = { userId: user.id };
    if (status && statusToEnum[status]) {
      where.status = statusToEnum[status];
    }
    if (agencyId) {
      where.agencyId = agencyId;
    }

    const [data, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: { agency: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map((r) => ({
        id: r.id,
        userId: r.userId,
        title: r.title,
        subject: r.subject,
        description: r.description,
        generatedLetter: r.generatedLetter,
        appealLetter: r.appealLetter,
        agencyId: r.agencyId ?? "",
        agencyName: r.agency?.name ?? "",
        status: statusToFrontend(r.status),
        qualityScore: r.qualityScore,
        filedAt: r.filedAt?.toISOString() ?? null,
        dueDate: r.dueDate?.toISOString() ?? null,
        respondedAt: r.respondedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
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
    const { title, subject, description, agencyId } = body;

    if (!title || !subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields: title, subject, description" },
        { status: 400 }
      );
    }

    const created = await prisma.request.create({
      data: {
        userId: user.id,
        title,
        subject,
        description,
        agencyId: agencyId || null,
        generatedLetter: body.generatedLetter ?? null,
        qualityScore: body.qualityScore ?? null,
        status: statusToEnum[body.status ?? "draft"] ?? "DRAFT",
      },
      include: { agency: true },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        requestId: created.id,
        action: "created_request",
        metadata: { title },
      },
    });

    // Create notification
    const isFiled = (body.status ?? "draft") === "filed";
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: isFiled ? "Request Filed" : "Draft Saved",
        message: isFiled
          ? `Your FOIA request "${title}" has been filed${created.agency?.name ? ` with ${created.agency.name}` : ""}`
          : `Draft "${title}" saved`,
        type: isFiled ? "success" : "info",
        link: `/tracker`,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          userId: created.userId,
          title: created.title,
          subject: created.subject,
          description: created.description,
          generatedLetter: created.generatedLetter,
          appealLetter: created.appealLetter,
          agencyId: created.agencyId ?? "",
          agencyName: created.agency?.name ?? "",
          status: statusToFrontend(created.status),
          qualityScore: created.qualityScore,
          filedAt: created.filedAt?.toISOString() ?? null,
          dueDate: created.dueDate?.toISOString() ?? null,
          respondedAt: created.respondedAt?.toISOString() ?? null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
