import { NextResponse } from "next/server";
import { discoverySearchLog } from "@/modules/discovery/services/search-log";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const items = discoverySearchLog.list(Number.isFinite(limit) ? limit : 20);

    return NextResponse.json({ data: items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to list searches", code: "DISCOVERY_ERROR" },
      { status: 500 },
    );
  }
}
