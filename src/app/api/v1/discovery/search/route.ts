import { NextResponse } from "next/server";
import { OverpassError } from "@/infrastructure/osm";
import { OvertureError } from "@/infrastructure/overture";
import { discoverySearchSchema } from "@/modules/discovery/schemas/search";
import { discoveryService } from "@/modules/discovery/services/discovery-service";
import { discoverySearchLog } from "@/modules/discovery/services/search-log";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import type { SearchRadiusKm } from "@/shared/config/business-categories";

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    await requireUserIfConfigured();

    const json = await request.json();
    const parsed = discoverySearchSchema.safeParse(json);

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

    const body = parsed.data;
    const result = await discoveryService.search({
      latitude: body.latitude,
      longitude: body.longitude,
      radiusKm: body.radiusKm as SearchRadiusKm,
      categoryIds: body.categoryIds,
      provider: body.provider,
      persist: body.persist,
      enrichWebsiteSocials: body.enrichWebsiteSocials,
    });

    discoverySearchLog.add({
      latitude: body.latitude,
      longitude: body.longitude,
      radiusKm: body.radiusKm,
      categoryIds: body.categoryIds,
      total: result.total,
      provider: result.provider,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof OverpassError || error instanceof OvertureError) {
      return NextResponse.json(
        {
          error: error.message,
          code:
            error instanceof OvertureError ? "OVERTURE_ERROR" : "OVERPASS_ERROR",
        },
        { status: 502 },
      );
    }

    console.error("[discovery/search]", error);
    return NextResponse.json(
      { error: "Discovery search failed", code: "DISCOVERY_ERROR" },
      { status: 500 },
    );
  }
}
