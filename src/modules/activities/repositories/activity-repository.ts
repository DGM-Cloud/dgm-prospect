import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class ActivityRepository {
  async create(data: Prisma.ActivityCreateInput) {
    return prisma.activity.create({
      data,
      include: { user: true },
    });
  }

  async listByProspect(prospectId: string, take = 50) {
    return prisma.activity.findMany({
      where: { prospectId },
      orderBy: { createdAt: "desc" },
      take,
      include: { user: true },
    });
  }

  async list(params: {
    prospectId?: string;
    skip?: number;
    take?: number;
    activityType?: ActivityType;
  }) {
    const where = {
      ...(params.prospectId ? { prospectId: params.prospectId } : {}),
      ...(params.activityType ? { activityType: params.activityType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 50,
        orderBy: { createdAt: "desc" },
        include: { user: true, prospect: true },
      }),
      prisma.activity.count({ where }),
    ]);

    return { items, total };
  }
}

export const activityRepository = new ActivityRepository();
