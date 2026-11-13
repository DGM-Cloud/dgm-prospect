import { NextResponse } from "next/server";
import { createOpportunitySchema } from "@/modules/pipeline/schemas/opportunity";
import {
  OpportunityNotFoundError,
  opportunityService,
} from "@/modules/pipeline/services/opportunity-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { OPPORTUNITY_STAGES } from "@/shared/types/enums";
import type { OpportunityStage } from "@prisma/client";
import { serializeForJson } from "@/shared/utilities/serialize";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();
    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get("stage");
    const stage =
      stageParam &&
      (OPPORTUNITY_STAGES as readonly string[]).includes(stageParam)
        ? (stageParam as OpportunityStage)
        : undefined;

    const result = await opportunityService.list({
      prospectId: searchParams.get("prospectId") ?? undefined,
      stage,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "50"),
    });

    return NextResponse.json({ data: serializeForJson(result) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to list opportunities", code: "OPPORTUNITY_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireUserIfConfigured();
    const json = await request.json();
    const parsed = createOpportunitySchema.safeParse(json);

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

    const opportunity = await opportunityService.create(parsed.data);
    return NextResponse.json(
      { data: serializeForJson(opportunity) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof OpportunityNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create opportunity", code: "OPPORTUNITY_ERROR" },
      { status: 500 },
    );
  }
}
