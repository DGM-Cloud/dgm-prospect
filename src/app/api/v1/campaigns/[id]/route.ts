import { NextResponse } from "next/server";
import { updateCampaignSchema } from "@/modules/campaigns/schemas/campaign";
import {
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireUserIfConfigured();
    const { id } = await context.params;
    const campaign = await campaignService.getById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to get campaign", code: "CAMPAIGN_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireUserIfConfigured();
    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateCampaignSchema.safeParse(json);

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

    const campaign = await campaignService.update(id, parsed.data);
    return NextResponse.json({ data: campaign });
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

    return NextResponse.json(
      { error: "Failed to update campaign", code: "CAMPAIGN_ERROR" },
      { status: 500 },
    );
  }
}
