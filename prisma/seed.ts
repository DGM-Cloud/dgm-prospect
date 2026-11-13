/**
 * Seed script for local development.
 * Creates a deterministic local shell user for Phase 2 flows without Supabase.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOCAL_SHELL_USER_ID = "00000000-0000-4000-8000-000000000001";

async function main() {
  const result = await prisma.$queryRaw<{ postgis_version: string }[]>`
    SELECT PostGIS_Version() AS postgis_version
  `;

  console.log("Database connected.");
  console.log("PostGIS version:", result[0]?.postgis_version ?? "unknown");

  await prisma.user.upsert({
    where: { id: LOCAL_SHELL_USER_ID },
    create: {
      id: LOCAL_SHELL_USER_ID,
      fullName: "Usuario local DGM",
      email: "local@dgm-prospect.dev",
      role: "ADMIN",
    },
    update: {
      fullName: "Usuario local DGM",
      email: "local@dgm-prospect.dev",
      role: "ADMIN",
    },
  });

  console.log("Local shell user ready:", LOCAL_SHELL_USER_ID);
  console.log(
    "When using Supabase Auth, upsert a matching users row with the Supabase user UUID.",
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
