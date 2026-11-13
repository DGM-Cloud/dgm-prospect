import type { UserRole } from "@/shared/types/enums";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};
