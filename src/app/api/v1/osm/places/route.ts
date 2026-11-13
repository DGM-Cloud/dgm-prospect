import { NextResponse } from "next/server";
import { osmPlaceService } from "@/modules/businesses/services/osm-place-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const take = Number(searchParams.get("take") ?? "50");
    const skip = Number(searchParams.get("skip") ?? "0");

    const result = await osmPlaceService.list({
      category,
      take: Number.isFinite(take) ? take : 50,
      skip: Number.isFinite(skip) ? skip : 0,
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
      { error: "Failed to list OSM places", code: "OSM_ERROR" },
      { status: 500 },
    );
  }
}
