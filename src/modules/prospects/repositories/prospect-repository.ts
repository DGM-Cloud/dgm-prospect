import type { Prisma, ProspectStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class ProspectRepository {
  async findById(id: string) {
    return prisma.prospect.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        osmPlace: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: true },
        },
        campaigns: {
          include: { campaign: true },
        },
      },
    });
  }

  async findByOsmPlaceId(osmPlaceId: string) {
    return prisma.prospect.findUnique({ where: { osmPlaceId } });
  }

  async create(data: Prisma.ProspectCreateInput) {
    return prisma.prospect.create({
      data,
      include: { assignedTo: true, osmPlace: true },
    });
  }

  async update(id: string, data: Prisma.ProspectUpdateInput) {
    return prisma.prospect.update({
      where: { id },
      data,
      include: {
        assignedTo: true,
        osmPlace: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: true },
        },
        campaigns: {
          include: { campaign: true },
        },
      },
    });
  }

  async list(params: {
    search?: string;
    status?: ProspectStatus;
    category?: string;
    assignedToId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ProspectWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.search
        ? {
            businessName: {
              contains: params.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: { assignedTo: true },
      }),
      prisma.prospect.count({ where }),
    ]);

    return { items, total };
  }

  async distinctCategories() {
    const rows = await prisma.prospect.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((row) => row.category).filter(Boolean) as string[];
  }
}

export const prospectRepository = new ProspectRepository();
