export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

    const data = await prisma.document.findUnique({
      where: { id, userId: user.id },
      include: { request: { select: { title: true } } },
    });

    if (!data) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        userId: data.userId,
        requestId: data.requestId ?? "",
        requestTitle: data.request?.title ?? "",
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        analysisStatus: data.analysisStatus.toLowerCase(),
        analysisResult: data.analysisResult,
        redactionCount: data.redactionCount ?? 0,
        pageCount: data.pageCount ?? 0,
        summary: data.summary,
        createdAt: data.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
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

    const existing = await prisma.document.findUnique({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.analysisStatus !== undefined) {
      updateData.analysisStatus = body.analysisStatus.toUpperCase();
    }
    if (body.analysisResult !== undefined)
      updateData.analysisResult = body.analysisResult;
    if (body.redactionCount !== undefined)
      updateData.redactionCount = body.redactionCount;
    if (body.pageCount !== undefined) updateData.pageCount = body.pageCount;
    if (body.summary !== undefined) updateData.summary = body.summary;

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: { request: { select: { title: true } } },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        userId: updated.userId,
        requestId: updated.requestId ?? "",
        requestTitle: updated.request?.title ?? "",
        fileName: updated.fileName,
        fileType: updated.fileType,
        fileSize: updated.fileSize,
        storagePath: updated.storagePath,
        analysisStatus: updated.analysisStatus.toLowerCase(),
        analysisResult: updated.analysisResult,
        redactionCount: updated.redactionCount ?? 0,
        pageCount: updated.pageCount ?? 0,
        summary: updated.summary,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
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

    const existing = await prisma.document.findUnique({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete file from Supabase Storage
    const supabase = await createClient();
    await supabase.storage.from("documents").remove([existing.storagePath]);

    // Delete metadata from database
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
