import { prisma } from "@/infrastructure/database/prisma";
import type { CreateAnalysisBody } from "../schemas/analysis";

export class AnalysisNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisNotFoundError";
  }
}

export class AnalysisService {
  async listByProspect(prospectId: string) {
    return prisma.analysis.findMany({
      where: { prospectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateAnalysisBody) {
    const prospect = await prisma.prospect.findUnique({
      where: { id: input.prospectId },
    });
    if (!prospect) {
      throw new AnalysisNotFoundError("Prospect not found");
    }

    return prisma.analysis.create({
      data: {
        prospectId: input.prospectId,
        finding: input.finding,
        opportunity: input.opportunity,
        confidence: input.confidence,
        source: input.source ?? "manual",
      },
    });
  }
}

export const analysisService = new AnalysisService();
