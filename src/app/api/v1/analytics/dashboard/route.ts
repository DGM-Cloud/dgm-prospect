import { NextResponse } from "next/server";
import { dashboardService } from "@/modules/analytics/services/dashboard-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

export async function GET() {
  try {
    await requireUserIfConfigured();
    const metrics = await dashboardService.getMetrics();
    return NextResponse.json({ data: metrics });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    console.error("[analytics/dashboard]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics", code: "ANALYTICS_ERROR" },
      { status: 500 },
    );
  }
}
