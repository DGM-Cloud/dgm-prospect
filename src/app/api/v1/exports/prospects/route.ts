import { NextResponse } from "next/server";
import { exportProspectsSchema } from "@/modules/reporting/schemas/export-prospects";
import { exportProspectsService } from "@/modules/reporting/services/export-prospects-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";

export async function POST(request: Request) {
  try {
    await requireUserIfConfigured();
    const json = await request.json();
    const parsed = exportProspectsSchema.safeParse(json);

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

    const rows = await exportProspectsService.collectRows(parsed.data);
    const stamp = new Date().toISOString().slice(0, 10);

    if (parsed.data.format === "csv") {
      const csv = exportProspectsService.toCsv(rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dgm-prospects-${stamp}.csv"`,
          "X-Export-Count": String(rows.length),
        },
      });
    }

    const buffer = await exportProspectsService.toXlsx(rows);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="dgm-prospects-${stamp}.xlsx"`,
        "X-Export-Count": String(rows.length),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    console.error("[exports/prospects]", error);
    return NextResponse.json(
      { error: "Failed to export prospects", code: "EXPORT_ERROR" },
      { status: 500 },
    );
  }
}
