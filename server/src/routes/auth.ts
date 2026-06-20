import { Router } from "express";
import {
  loginHandler,
  meHandler,
  signupHandler,
} from "../controllers/authController";
import { asyncHandler } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(signupHandler));
authRoutes.post("/login", asyncHandler(loginHandler));
authRoutes.get("/me", authenticate, asyncHandler(meHandler));
