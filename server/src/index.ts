// Server bootstrap: HTTP + Socket.IO share one port.
import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";
import { config } from "./config";
import { initSocket } from "./sockets";
import { prisma } from "./prisma/client";

async function main() {
  const app = createApp();
  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    await prisma.$disconnect();
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
