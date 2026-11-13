import { NextResponse } from "next/server";
import { createAnalysisSchema } from "@/modules/digital-intelligence/schemas/analysis";
import {
  AnalysisNotFoundError,
  analysisService,
} from "@/modules/digital-intelligence/services/analysis-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

export async function GET(request: Request) {
  try {
    await requireUserIfConfigured();
    const { searchParams } = new URL(request.url);
    const prospectId = searchParams.get("prospectId");
    if (!prospectId) {
      return NextResponse.json(
        { error: "prospectId is required", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const items = await analysisService.listByProspect(prospectId);
    return NextResponse.json({ data: items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to list analyses", code: "ANALYSIS_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireUserIfConfigured();
    const json = await request.json();
    const parsed = createAnalysisSchema.safeParse(json);

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

    const analysis = await analysisService.create(parsed.data);
    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    if (error instanceof AnalysisNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create analysis", code: "ANALYSIS_ERROR" },
      { status: 500 },
    );
  }
}
