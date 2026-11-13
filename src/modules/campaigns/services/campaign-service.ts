import type { CampaignStatus } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { campaignRepository } from "../repositories/campaign-repository";
import type {
  CreateCampaignBody,
  UpdateCampaignBody,
} from "../schemas/campaign";

export class CampaignNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignNotFoundError";
  }
}

export class CampaignConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignConflictError";
  }
}

export class CampaignService {
  async list(params: {
    search?: string;
    status?: CampaignStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const { items, total } = await campaignRepository.list({
      search: params.search,
      status: params.status,
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

  async getById(id: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return null;
    }
    const stats = await campaignRepository.stats(id);
    return { ...campaign, stats };
  }

  async create(input: CreateCampaignBody, createdById: string) {
    return campaignRepository.create({
      name: input.name,
      description: input.description,
      zoneLabel: input.zoneLabel,
      categories: input.categories ?? [],
      status: input.status ?? "DRAFT",
      createdBy: { connect: { id: createdById } },
    });
  }

  async update(id: string, input: UpdateCampaignBody) {
    const existing = await campaignRepository.findById(id);
    if (!existing) {
      throw new CampaignNotFoundError("Campaign not found");
    }

    return campaignRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.zoneLabel !== undefined ? { zoneLabel: input.zoneLabel } : {}),
      ...(input.categories !== undefined
        ? { categories: input.categories }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
  }

  async addProspect(campaignId: string, prospectId: string) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new CampaignNotFoundError("Campaign not found");
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });
    if (!prospect) {
      throw new CampaignNotFoundError("Prospect not found");
    }

    const existing = await campaignRepository.findLink(campaignId, prospectId);
    if (existing) {
      throw new CampaignConflictError(
        "Prospect already belongs to this campaign",
      );
    }

    return campaignRepository.addProspect(campaignId, prospectId);
  }

  async removeProspect(campaignId: string, prospectId: string) {
    const existing = await campaignRepository.findLink(campaignId, prospectId);
    if (!existing) {
      throw new CampaignNotFoundError("Campaign prospect link not found");
    }
    await campaignRepository.removeProspect(campaignId, prospectId);
    return { ok: true };
  }
}

export const campaignService = new CampaignService();
