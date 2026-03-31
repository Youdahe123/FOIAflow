import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { AnalysisStatus as PrismaAnalysisStatus } from "@/generated/prisma/client";

const analysisStatusToEnum: Record<string, PrismaAnalysisStatus> = {
  pending: "PENDING",
  analyzing: "ANALYZING",
  completed: "COMPLETED",
  failed: "FAILED",
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    const analysisStatus = searchParams.get("analysisStatus");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    const where: Record<string, unknown> = { userId: user.id };
    if (requestId) {
      where.requestId = requestId;
    }
    if (analysisStatus && analysisStatusToEnum[analysisStatus]) {
      where.analysisStatus = analysisStatusToEnum[analysisStatus];
    }

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: { request: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map((d) => ({
        id: d.id,
        userId: d.userId,
        requestId: d.requestId ?? "",
        requestTitle: d.request?.title ?? "",
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        storagePath: d.storagePath,
        analysisStatus: d.analysisStatus.toLowerCase(),
        analysisResult: d.analysisResult,
        redactionCount: d.redactionCount ?? 0,
        pageCount: d.pageCount ?? 0,
        summary: d.summary,
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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
    const { fileName, fileType, fileSize, storagePath } = body;

    if (!fileName || !fileType || !fileSize || !storagePath) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: fileName, fileType, fileSize, storagePath",
        },
        { status: 400 }
      );
    }

    const created = await prisma.document.create({
      data: {
        userId: user.id,
        requestId: body.requestId || null,
        fileName,
        fileType,
        fileSize,
        storagePath,
      },
      include: { request: { select: { title: true } } },
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        requestId: body.requestId || null,
        action: "uploaded_document",
        metadata: { fileName },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          userId: created.userId,
          requestId: created.requestId ?? "",
          requestTitle: created.request?.title ?? "",
          fileName: created.fileName,
          fileType: created.fileType,
          fileSize: created.fileSize,
          storagePath: created.storagePath,
          analysisStatus: created.analysisStatus.toLowerCase(),
          analysisResult: created.analysisResult,
          redactionCount: created.redactionCount ?? 0,
          pageCount: created.pageCount ?? 0,
          summary: created.summary,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
