import { NextResponse } from "next/server";
import { addCampaignProspectSchema } from "@/modules/campaigns/schemas/campaign";
import {
  CampaignConflictError,
  CampaignNotFoundError,
  campaignService,
} from "@/modules/campaigns/services/campaign-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireUserIfConfigured();
    const { id } = await context.params;
    const json = await request.json();
    const parsed = addCampaignProspectSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const link = await campaignService.addProspect(id, parsed.data.prospectId);
    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (error instanceof CampaignConflictError) {
      return NextResponse.json(
        { error: error.message, code: "DUPLICATE_LINK" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add prospect to campaign", code: "CAMPAIGN_ERROR" },
      { status: 500 },
    );
  }
}
