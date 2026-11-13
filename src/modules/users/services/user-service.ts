import type { User } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import { userRepository } from "../repositories/user-repository";

export class UserService {
  async getById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  async listAssignees() {
    return prisma.user.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  }

  async syncFromAuth(params: {
    id: string;
    email: string;
    fullName?: string | null;
  }): Promise<User> {
    const fullName =
      params.fullName?.trim() ||
      params.email.split("@")[0] ||
      "Usuario DGM";

    return userRepository.upsertFromAuth({
      id: params.id,
      email: params.email,
      fullName,
    });
  }
}

export const userService = new UserService();
