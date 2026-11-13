import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  let database: "up" | "down" = "down";
  let postgis: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
    const rows = await prisma.$queryRaw<{ version: string }[]>`
      SELECT PostGIS_Version() AS version
    `;
    postgis = rows[0]?.version ?? null;
  } catch {
    database = "down";
  }

  const body = {
    status: database === "up" ? "ok" : "degraded",
    service: "dgm-prospect",
    timestamp: new Date().toISOString(),
    checks: {
      database,
      postgis,
      supabaseConfigured: isSupabaseConfigured(),
    },
  };

  return NextResponse.json(body, {
    status: database === "up" ? 200 : 503,
  });
}
