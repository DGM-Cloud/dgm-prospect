import { NextResponse } from "next/server";
import { createActivitySchema } from "@/modules/activities/schemas/create-activity";
import {
  ActivityNotFoundError,
  activityService,
} from "@/modules/activities/services/activity-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { ACTIVITY_TYPES } from "@/shared/types/enums";
import type { ActivityType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("activityType");
    const activityType =
      typeParam && (ACTIVITY_TYPES as readonly string[]).includes(typeParam)
        ? (typeParam as ActivityType)
        : undefined;

    const result = await activityService.list({
      prospectId: searchParams.get("prospectId") ?? undefined,
      activityType,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "50"),
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
      { error: "Failed to list activities", code: "ACTIVITY_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserIfConfigured();
    const json = await request.json();
    const parsed = createActivitySchema.safeParse(json);

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

    const activity = await activityService.create({
      prospectId: parsed.data.prospectId,
      userId: user.id,
      activityType: parsed.data.activityType,
      description: parsed.data.description,
    });

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof ActivityNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create activity", code: "ACTIVITY_ERROR" },
      { status: 500 },
    );
  }
}
