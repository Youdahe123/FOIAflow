export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AgencyLevel as PrismaAgencyLevel } from "@/generated/prisma/client";

const levelToEnum: Record<string, PrismaAgencyLevel> = {
  federal: "FEDERAL",
  state: "STATE",
  local: "LOCAL",
  tribal: "TRIBAL",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const level = searchParams.get("level");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { abbreviation: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (level && levelToEnum[level]) {
      where.level = levelToEnum[level];
    }
    if (category) {
      where.category = category;
    }

    const [data, total] = await Promise.all([
      prisma.agency.findMany({
        where,
        include: { _count: { select: { requests: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agency.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map((a) => ({
        id: a.id,
        name: a.name,
        abbreviation: a.abbreviation ?? "",
        level: a.level.toLowerCase(),
        jurisdiction: a.jurisdiction ?? "",
        foiaEmail: a.foiaEmail ?? "",
        foiaUrl: a.foiaUrl ?? "",
        foiaPhone: a.foiaPhone ?? null,
        mailingAddress: a.mailingAddress ?? "",
        foiaOfficer: a.foiaOfficer ?? null,
        description: a.description ?? "",
        averageResponseDays: a.averageResponseDays ?? 0,
        complianceRating: a.complianceRating ?? 0,
        category: a.category ?? "",
        requestCount: a._count.requests,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch agencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch agencies" },
      { status: 500 }
    );
  }
}
