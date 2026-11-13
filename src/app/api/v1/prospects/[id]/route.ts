import { NextResponse } from "next/server";
import {
  ProspectNotFoundError,
  prospectService,
} from "@/modules/prospects/services/prospect-service";
import { updateProspectSchema } from "@/modules/prospects/schemas/update-prospect";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { serializeForJson } from "@/shared/utilities/serialize";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireUserIfConfigured();
    const { id } = await context.params;
    const prospect = await prospectService.getById(id);

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: serializeForJson(prospect) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to get prospect", code: "PROSPECT_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUserIfConfigured();
    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateProspectSchema.safeParse(json);

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

    const prospect = await prospectService.update(id, parsed.data, user.id);
    return NextResponse.json({ data: serializeForJson(prospect) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof ProspectNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    console.error("[prospects/:id PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update prospect", code: "PROSPECT_ERROR" },
      { status: 500 },
    );
  }
}
