import { NextResponse } from "next/server";
import { createProspectSchema } from "@/modules/prospects/schemas/create-prospect";
import {
  ProspectConflictError,
  ProspectNotFoundError,
  prospectService,
} from "@/modules/prospects/services/prospect-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { serializeForJson } from "@/shared/utilities/serialize";
import { PROSPECT_STATUSES } from "@/shared/types/enums";
import type { ProspectStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam &&
      (PROSPECT_STATUSES as readonly string[]).includes(statusParam)
        ? (statusParam as ProspectStatus)
        : undefined;

    const result = await prospectService.list({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      assignedToId: searchParams.get("assignedToId") ?? undefined,
      status,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "20"),
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
      { error: "Failed to list prospects", code: "PROSPECT_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserIfConfigured();
    const json = await request.json();
    const parsed = createProspectSchema.safeParse(json);

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

    const prospect = await prospectService.createFromOsmPlace({
      osmPlaceId: parsed.data.osmPlaceId,
      notes: parsed.data.notes,
      assignedToId: user.id,
      actorUserId: user.id,
    });

    return NextResponse.json(
      { data: serializeForJson(prospect) },
      { status: 201 },
    );
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

    if (error instanceof ProspectConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "DUPLICATE_PROSPECT",
          existingProspectId: error.existingProspectId,
        },
        { status: 409 },
      );
    }

    console.error("[prospects]", error);
    return NextResponse.json(
      { error: "Failed to create prospect", code: "PROSPECT_ERROR" },
      { status: 500 },
    );
  }
}
