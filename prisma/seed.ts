import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AgencyLevel } from "../src/generated/prisma/client.js";
import { mockAgencies } from "../src/data/mock-agencies.js";

function getPostgresUrl(): string {
  const raw = process.env.DATABASE_URL!;
  if (raw.startsWith("prisma+postgres://")) {
    const match = raw.match(/api_key=(.+)/);
    if (match) {
      const decoded = JSON.parse(Buffer.from(match[1], "base64").toString());
      return decoded.databaseUrl;
    }
  }
  return raw;
}

const adapter = new PrismaPg(getPostgresUrl());
const prisma = new PrismaClient({ adapter });

const levelMap: Record<string, AgencyLevel> = {
  federal: "FEDERAL",
  state: "STATE",
  local: "LOCAL",
  tribal: "TRIBAL",
};

async function main() {
  console.log("Seeding agencies...");

  // Clear existing agencies and re-insert (safe for reference data)
  await prisma.agency.deleteMany();

  const created = await prisma.agency.createMany({
    data: mockAgencies.map((agency) => ({
      name: agency.name,
      abbreviation: agency.abbreviation || null,
      level: levelMap[agency.level] ?? "FEDERAL",
      jurisdiction: agency.jurisdiction || null,
      foiaEmail: agency.foiaEmail || null,
      foiaUrl: agency.foiaUrl || null,
      foiaPhone: agency.foiaPhone ?? null,
      mailingAddress: agency.mailingAddress || null,
      foiaOfficer: agency.foiaOfficer ?? null,
      description: agency.description || null,
      averageResponseDays: agency.averageResponseDays ?? null,
      complianceRating: agency.complianceRating ?? null,
      category: agency.category || null,
    })),
  });

  console.log(`Seeded ${created.count} agencies.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
