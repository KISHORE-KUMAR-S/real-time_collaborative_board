// JWT signing/verifying. Token payload carries just the user id; roles are
// always resolved fresh from the DB so a role change takes effect immediately.
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
  sub: string; // user id
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === "string" || !decoded.sub) {
    throw new Error("Invalid token payload");
  }
  return { sub: String(decoded.sub) };
}
