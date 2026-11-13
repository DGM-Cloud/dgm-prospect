import { NextResponse } from "next/server";
import { osmPlaceService } from "@/modules/businesses/services/osm-place-service";
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
    const place = await osmPlaceService.getById(id);

    if (!place) {
      return NextResponse.json(
        { error: "OSM place not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: place });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to get OSM place", code: "OSM_ERROR" },
      { status: 500 },
    );
  }
}
