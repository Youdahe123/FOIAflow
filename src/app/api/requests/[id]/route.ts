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

function mapRequest(r: {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description: string;
  generatedLetter: string | null;
  appealLetter: string | null;
  agencyId: string | null;
  agency?: { name: string } | null;
  status: PrismaStatus;
  qualityScore: number | null;
  filedAt: Date | null;
  dueDate: Date | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const data = await prisma.request.findUnique({
      where: { id, userId: user.id },
      include: { agency: true },
    });

    if (!data) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: mapRequest(data) });
  } catch (error) {
    console.error("Failed to fetch request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.request.findUnique({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Build update payload — only allow safe fields
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.generatedLetter !== undefined)
      updateData.generatedLetter = body.generatedLetter;
    if (body.appealLetter !== undefined)
      updateData.appealLetter = body.appealLetter;
    if (body.agencyId !== undefined) updateData.agencyId = body.agencyId;
    if (body.status !== undefined && statusToEnum[body.status])
      updateData.status = statusToEnum[body.status];
    if (body.qualityScore !== undefined)
      updateData.qualityScore = body.qualityScore;
    if (body.filedAt !== undefined)
      updateData.filedAt = body.filedAt ? new Date(body.filedAt) : null;
    if (body.dueDate !== undefined)
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.respondedAt !== undefined)
      updateData.respondedAt = body.respondedAt
        ? new Date(body.respondedAt)
        : null;

    const updated = await prisma.request.update({
      where: { id },
      data: updateData,
      include: { agency: true },
    });

    return NextResponse.json({ data: mapRequest(updated) });
  } catch (error) {
    console.error("Failed to update request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.request.findUnique({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    await prisma.request.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete request:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
