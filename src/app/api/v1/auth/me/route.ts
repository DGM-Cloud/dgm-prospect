import { NextResponse } from "next/server";
import { AuthError, authService } from "@/modules/identity/services/auth-service";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase Auth is not configured",
        code: "SUPABASE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  try {
    const user = await authService.requireUser();
    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Unexpected authentication error", code: "AUTH_ERROR" },
      { status: 500 },
    );
  }
}
