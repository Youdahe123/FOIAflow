import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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

function createPrismaClient() {
  const url = getPostgresUrl();
  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
