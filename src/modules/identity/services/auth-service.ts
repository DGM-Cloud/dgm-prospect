import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { userService } from "@/modules/users/services/user-service";
import type { AuthUser } from "../types";
import type { UserRole } from "@/shared/types/enums";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return null;
    }

    const localUser = await userService.syncFromAuth({
      id: user.id,
      email: user.email,
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
    });

    return {
      id: localUser.id,
      email: localUser.email,
      fullName: localUser.fullName,
      role: localUser.role as UserRole,
    };
  }

  async requireUser(): Promise<AuthUser> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new AuthError("Authentication required", 401);
    }
    return user;
  }

  async requireRole(allowed: UserRole[]): Promise<AuthUser> {
    const user = await this.requireUser();
    if (!allowed.includes(user.role)) {
      throw new AuthError("Insufficient permissions", 403);
    }
    return user;
  }
}

export const authService = new AuthService();
