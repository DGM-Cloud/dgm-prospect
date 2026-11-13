import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type { NormalizedBusiness } from "@/infrastructure/osm";

/**
 * Persists OSM places separately from commercial Prospect records.
 * Geospatial `location` column is updated via raw SQL (PostGIS).
 */
export class OsmPlaceRepository {
  async findByOsmKey(osmType: string, osmId: bigint) {
    return prisma.osmPlace.findUnique({
      where: { osmType_osmId: { osmType, osmId } },
    });
  }

  async upsertNormalized(business: NormalizedBusiness) {
    const osmId = BigInt(business.osmId);
    const tags = business.tags as Prisma.InputJsonValue;

    const place = await prisma.osmPlace.upsert({
      where: {
        osmType_osmId: { osmType: business.osmType, osmId },
      },
      create: {
        osmType: business.osmType,
        osmId,
        name: business.name,
        category: business.category,
        latitude: business.latitude,
        longitude: business.longitude,
        tags,
      },
      update: {
        name: business.name,
        category: business.category,
        latitude: business.latitude,
        longitude: business.longitude,
        tags,
      },
    });

    await prisma.$executeRawUnsafe(
      `UPDATE osm_places
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       WHERE id = $3`,
      business.longitude,
      business.latitude,
      place.id,
    );

    return place;
  }
}

export const osmPlaceRepository = new OsmPlaceRepository();
