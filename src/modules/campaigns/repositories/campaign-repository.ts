import type { CampaignStatus, Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class CampaignRepository {
  async create(data: Prisma.CampaignCreateInput) {
    return prisma.campaign.create({
      data,
      include: {
        createdBy: true,
        _count: { select: { prospects: true } },
      },
    });
  }

  async update(id: string, data: Prisma.CampaignUpdateInput) {
    return prisma.campaign.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        _count: { select: { prospects: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: true,
        prospects: {
          orderBy: { addedAt: "desc" },
          include: {
            prospect: {
              include: { assignedTo: true },
            },
          },
        },
        _count: { select: { prospects: true } },
      },
    });
  }

  async list(params: {
    search?: string;
    status?: CampaignStatus;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.CampaignWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            name: {
              contains: params.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: true,
          _count: { select: { prospects: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return { items, total };
  }

  async addProspect(campaignId: string, prospectId: string) {
    return prisma.campaignProspect.create({
      data: { campaignId, prospectId },
      include: { prospect: true, campaign: true },
    });
  }

  async removeProspect(campaignId: string, prospectId: string) {
    return prisma.campaignProspect.delete({
      where: {
        campaignId_prospectId: { campaignId, prospectId },
      },
    });
  }

  async findLink(campaignId: string, prospectId: string) {
    return prisma.campaignProspect.findUnique({
      where: {
        campaignId_prospectId: { campaignId, prospectId },
      },
    });
  }

  async stats(campaignId: string) {
    const links = await prisma.campaignProspect.findMany({
      where: { campaignId },
      include: { prospect: { select: { status: true } } },
    });

    const byStatus: Record<string, number> = {};
    for (const link of links) {
      const status = link.prospect.status;
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    return {
      totalProspects: links.length,
      byStatus,
    };
  }
}

export const campaignRepository = new CampaignRepository();
