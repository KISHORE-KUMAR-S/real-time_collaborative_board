// Express app assembly, kept separate from server bootstrap for clarity/testing.
import express from "express";
import compression from "compression";
import cors from "cors";
import { config } from "./config";
import { authRoutes } from "./routes/auth";
import { boardRoutes } from "./routes/boards";
import { cardRoutes } from "./routes/cards";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(compression());
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/boards", boardRoutes);
  app.use("/api/v1/cards", cardRoutes);

  app.use(errorHandler);

  return app;
}
