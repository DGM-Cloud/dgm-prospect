import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export type UpsertUserInput = {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
};

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async upsertFromAuth(input: UpsertUserInput): Promise<User> {
    return prisma.user.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        email: input.email,
        fullName: input.fullName,
        role: input.role ?? "MEMBER",
      },
      update: {
        email: input.email,
        fullName: input.fullName,
      },
    });
  }
}

export const userRepository = new UserRepository();
