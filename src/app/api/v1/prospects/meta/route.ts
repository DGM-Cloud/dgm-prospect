import { NextResponse } from "next/server";
import { prospectService } from "@/modules/prospects/services/prospect-service";
import { userService } from "@/modules/users/services/user-service";
import {
  AuthError,
  requireUserIfConfigured,
} from "@/modules/identity/services/request-auth";
import { PROSPECT_STATUSES } from "@/shared/types/enums";

export async function GET() {
  try {
    await requireUserIfConfigured();
    const [categories, assignees] = await Promise.all([
      prospectService.listCategories(),
      userService.listAssignees(),
    ]);

    return NextResponse.json({
      data: {
        statuses: PROSPECT_STATUSES,
        categories,
        assignees,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Failed to load prospect metadata", code: "PROSPECT_ERROR" },
      { status: 500 },
    );
  }
}
