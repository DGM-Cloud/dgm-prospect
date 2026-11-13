import type { OpportunityStage } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type {
  CreateOpportunityBody,
  UpdateOpportunityBody,
} from "../schemas/opportunity";

export class OpportunityNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpportunityNotFoundError";
  }
}

export class OpportunityService {
  async list(params: {
    prospectId?: string;
    stage?: OpportunityStage;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where = {
      ...(params.prospectId ? { prospectId: params.prospectId } : {}),
      ...(params.stage ? { stage: params.stage } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          prospect: {
            select: {
              id: true,
              businessName: true,
              category: true,
              status: true,
            },
          },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async create(input: CreateOpportunityBody) {
    const prospect = await prisma.prospect.findUnique({
      where: { id: input.prospectId },
    });
    if (!prospect) {
      throw new OpportunityNotFoundError("Prospect not found");
    }

    return prisma.opportunity.create({
      data: {
        prospectId: input.prospectId,
        service: input.service,
        stage: input.stage ?? "IDENTIFIED",
        estimatedValue: input.estimatedValue,
        notes: input.notes,
      },
      include: {
        prospect: {
          select: { id: true, businessName: true, status: true },
        },
      },
    });
  }

  async update(id: string, input: UpdateOpportunityBody) {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new OpportunityNotFoundError("Opportunity not found");
    }

    return prisma.opportunity.update({
      where: { id },
      data: {
        ...(input.service !== undefined ? { service: input.service } : {}),
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(input.estimatedValue !== undefined
          ? { estimatedValue: input.estimatedValue }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: {
        prospect: {
          select: { id: true, businessName: true, status: true },
        },
      },
    });
  }
}

export const opportunityService = new OpportunityService();
