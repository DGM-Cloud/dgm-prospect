import type { ActivityType } from "@prisma/client";
import { activityRepository } from "../repositories/activity-repository";
import { prisma } from "@/infrastructure/database/prisma";

export class ActivityNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityNotFoundError";
  }
}

export class ActivityService {
  async list(params: {
    prospectId?: string;
    activityType?: ActivityType;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));
    const { items, total } = await activityRepository.list({
      prospectId: params.prospectId,
      activityType: params.activityType,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async create(params: {
    prospectId: string;
    userId: string;
    activityType: ActivityType;
    description: string;
  }) {
    const prospect = await prisma.prospect.findUnique({
      where: { id: params.prospectId },
    });
    if (!prospect) {
      throw new ActivityNotFoundError("Prospect not found");
    }

    return activityRepository.create({
      activityType: params.activityType,
      description: params.description,
      prospect: { connect: { id: params.prospectId } },
      user: { connect: { id: params.userId } },
    });
  }
}

export const activityService = new ActivityService();
