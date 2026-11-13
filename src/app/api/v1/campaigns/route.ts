import { NextResponse } from "next/server";
import { createCampaignSchema } from "@/modules/campaigns/schemas/campaign";
import { campaignService } from "@/modules/campaigns/services/campaign-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { CAMPAIGN_STATUSES } from "@/shared/types/enums";
import type { CampaignStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam &&
      (CAMPAIGN_STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as CampaignStatus)
        : undefined;

    const result = await campaignService.list({
      search: searchParams.get("search") ?? undefined,
      status,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "20"),
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to list campaigns", code: "CAMPAIGN_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserIfConfigured();
    const json = await request.json();
    const parsed = createCampaignSchema.safeParse(json);

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

    const campaign = await campaignService.create(parsed.data, user.id);
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    console.error("[campaigns]", error);
    return NextResponse.json(
      { error: "Failed to create campaign", code: "CAMPAIGN_ERROR" },
      { status: 500 },
    );
  }
}
