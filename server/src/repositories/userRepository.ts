// User data access + DTO mapping.
import { User } from "@prisma/client";
import { prisma } from "../prisma/client";
import { UserDTO } from "../types";

export function toUserDTO(user: User): UserDTO {
  return { id: user.id, email: user.email, name: user.name };
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({ data: input });
}
