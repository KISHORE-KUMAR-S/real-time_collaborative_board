import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../auth/jwt";
import { loginSchema, signupSchema } from "../validation/authSchemas";
import {
  createUser,
  findUserById,
  findUserByEmail,
  toUserDTO,
} from "../repositories/userRepository";
import { listBoardsForUser } from "../repositories/boardRepository";
import { AuthResponse } from "../types";
import { HttpError } from "../middleware/errorHandler";

// POST /api/auth/signup
export async function signupHandler(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);

  const existing = await findUserByEmail(input.email);
  if (existing) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    email: input.email,
    name: input.name,
    passwordHash,
  });

  const body: AuthResponse = {
    token: signToken(user.id),
    user: toUserDTO(user),
  };
  res.status(201).json(body);
}

// POST /api/auth/login
export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  const user = await findUserByEmail(input.email);
  // Same error whether the email is unknown or the password is wrong, so we
  // don't leak which emails exist.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }

  const body: AuthResponse = {
    token: signToken(user.id),
    user: toUserDTO(user),
  };
  res.json(body);
}

// GET /api/auth/me  — current user + the boards they belong to (with role)
export async function meHandler(req: Request, res: Response) {
  const user = await findUserById(req.userId!);
  if (!user) throw new HttpError(401, "User no longer exists");
  res.json({
    user: toUserDTO(user),
    boards: await listBoardsForUser(user.id),
  });
}
