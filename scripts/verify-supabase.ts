import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const ping = await prisma.$queryRawUnsafe<
      Array<{ db: string; usr: string; postgis: string }>
    >(
      `SELECT current_database() AS db, current_user AS usr, PostGIS_Version() AS postgis`,
    );
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN (
           'users','osm_places','prospects','campaigns','campaign_prospects',
           'analyses','activities','opportunities'
         )
       ORDER BY table_name`,
    );
    console.log(
      JSON.stringify(
        {
          connected: ping[0],
          tables: tables.map((t) => t.table_name),
          tableCount: tables.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
