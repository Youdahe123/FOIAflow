export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const data = await prisma.agency.findUnique({
      where: { id },
      include: { _count: { select: { requests: true } } },
    });

    if (!data) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        abbreviation: data.abbreviation ?? "",
        level: data.level.toLowerCase(),
        jurisdiction: data.jurisdiction ?? "",
        foiaEmail: data.foiaEmail ?? "",
        foiaUrl: data.foiaUrl ?? "",
        foiaPhone: data.foiaPhone ?? null,
        mailingAddress: data.mailingAddress ?? "",
        foiaOfficer: data.foiaOfficer ?? null,
        description: data.description ?? "",
        averageResponseDays: data.averageResponseDays ?? 0,
        complianceRating: data.complianceRating ?? 0,
        category: data.category ?? "",
        requestCount: data._count.requests,
      },
    });
  } catch (error) {
    console.error("Failed to fetch agency:", error);
    return NextResponse.json(
      { error: "Failed to fetch agency" },
      { status: 500 }
    );
  }
}
