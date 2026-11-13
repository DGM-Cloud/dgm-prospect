import { NextResponse } from "next/server";
import { updateOpportunitySchema } from "@/modules/pipeline/schemas/opportunity";
import {
  OpportunityNotFoundError,
  opportunityService,
} from "@/modules/pipeline/services/opportunity-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { serializeForJson } from "@/shared/utilities/serialize";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireUserIfConfigured();
    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateOpportunitySchema.safeParse(json);

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

    const opportunity = await opportunityService.update(id, parsed.data);
    return NextResponse.json({ data: serializeForJson(opportunity) });
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
      { error: "Failed to update opportunity", code: "OPPORTUNITY_ERROR" },
      { status: 500 },
    );
  }
}
