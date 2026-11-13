import { prisma } from "@/infrastructure/database/prisma";

const PENDING_STATUSES = ["DISCOVERED", "TO_REVIEW", "CONTACT_PENDING"] as const;
const OPEN_OPPORTUNITY_STAGES = [
  "IDENTIFIED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
] as const;

export type DashboardMetrics = {
  totalProspects: number;
  pendingProspects: number;
  qualifiedProspects: number;
  openOpportunities: number;
  proposalOpportunities: number;
  convertedClients: number;
  activeCampaigns: number;
  totalAnalyses: number;
  prospectsByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
  recentProspects: Array<{
    id: string;
    businessName: string;
    status: string;
    category: string | null;
    createdAt: Date;
  }>;
  generatedAt: string;
};

export class DashboardService {
  async getMetrics(): Promise<DashboardMetrics> {
    const [
      totalProspects,
      pendingProspects,
      qualifiedProspects,
      convertedClients,
      openOpportunities,
      proposalOpportunities,
      activeCampaigns,
      totalAnalyses,
      statusGroups,
      stageGroups,
      recentProspects,
    ] = await Promise.all([
      prisma.prospect.count(),
      prisma.prospect.count({
        where: { status: { in: [...PENDING_STATUSES] } },
      }),
      prisma.prospect.count({ where: { status: "QUALIFIED" } }),
      prisma.prospect.count({ where: { status: "WON" } }),
      prisma.opportunity.count({
        where: { stage: { in: [...OPEN_OPPORTUNITY_STAGES] } },
      }),
      prisma.opportunity.count({ where: { stage: "PROPOSAL" } }),
      prisma.campaign.count({
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
      }),
      prisma.analysis.count(),
      prisma.prospect.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.opportunity.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
      prisma.prospect.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          businessName: true,
          status: true,
          category: true,
          createdAt: true,
        },
      }),
    ]);

    const prospectsByStatus: Record<string, number> = {};
    for (const row of statusGroups) {
      prospectsByStatus[row.status] = row._count._all;
    }

    const opportunitiesByStage: Record<string, number> = {};
    for (const row of stageGroups) {
      opportunitiesByStage[row.stage] = row._count._all;
    }

    return {
      totalProspects,
      pendingProspects,
      qualifiedProspects,
      openOpportunities,
      proposalOpportunities,
      convertedClients,
      activeCampaigns,
      totalAnalyses,
      prospectsByStatus,
      opportunitiesByStage,
      recentProspects,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const dashboardService = new DashboardService();
