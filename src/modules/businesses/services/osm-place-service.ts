import { prisma } from "@/infrastructure/database/prisma";

function serializePlace<T extends { osmId: bigint }>(place: T) {
  return {
    ...place,
    osmId: place.osmId.toString(),
  };
}

export class OsmPlaceService {
  async list(params: { category?: string; take?: number; skip?: number }) {
    const take = Math.min(100, Math.max(1, params.take ?? 50));
    const skip = Math.max(0, params.skip ?? 0);

    const where = params.category ? { category: params.category } : {};

    const [items, total] = await Promise.all([
      prisma.osmPlace.findMany({
        where,
        orderBy: { importedAt: "desc" },
        take,
        skip,
      }),
      prisma.osmPlace.count({ where }),
    ]);

    return {
      items: items.map(serializePlace),
      total,
    };
  }

  async getById(id: string) {
    const place = await prisma.osmPlace.findUnique({
      where: { id },
      include: { prospect: true },
    });

    if (!place) {
      return null;
    }

    return {
      ...serializePlace(place),
      prospect: place.prospect,
    };
  }
}

export const osmPlaceService = new OsmPlaceService();
