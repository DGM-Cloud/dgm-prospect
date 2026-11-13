import { isSupabaseConfigured } from "@/lib/env";
import { AuthError, authService } from "./auth-service";
import type { AuthUser } from "../types";
import {
  LOCAL_SHELL_USER_EMAIL,
  LOCAL_SHELL_USER_ID,
  LOCAL_SHELL_USER_NAME,
} from "@/modules/users/constants";
import { ensureLocalShellUser } from "@/modules/users/services/ensure-local-user";

/**
 * When Supabase is configured, require a real session.
 * When not configured, ensure and return the local shell user so campaigns,
 * activities and assignments work during Phase 2 development.
 */
export async function requireUserIfConfigured(): Promise<AuthUser> {
  if (!isSupabaseConfigured()) {
    await ensureLocalShellUser();
    return {
      id: LOCAL_SHELL_USER_ID,
      email: LOCAL_SHELL_USER_EMAIL,
      fullName: LOCAL_SHELL_USER_NAME,
      role: "ADMIN",
    };
  }
  return authService.requireUser();
}

export { AuthError };
