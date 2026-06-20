// Seed a default board owned by a demo user, plus a few starter cards.
// Idempotent: re-running upserts the same user/board instead of duplicating.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_BOARD_ID =
  process.env.DEFAULT_BOARD_ID ?? "11111111-1111-1111-1111-111111111111";

// Demo accounts so the app is usable immediately after `docker compose up`.
const DEMO = {
  owner: { email: "owner@board.test", name: "Demo Owner", password: "password123" },
  viewer: { email: "viewer@board.test", name: "Demo Viewer", password: "password123" },
};

async function main() {
  const ownerHash = await bcrypt.hash(DEMO.owner.password, 10);
  const viewerHash = await bcrypt.hash(DEMO.viewer.password, 10);

  const owner = await prisma.user.upsert({
    where: { email: DEMO.owner.email },
    update: {},
    create: { email: DEMO.owner.email, name: DEMO.owner.name, passwordHash: ownerHash },
  });

  const viewer = await prisma.user.upsert({
    where: { email: DEMO.viewer.email },
    update: {},
    create: { email: DEMO.viewer.email, name: DEMO.viewer.name, passwordHash: viewerHash },
  });

  const board = await prisma.board.upsert({
    where: { id: DEFAULT_BOARD_ID },
    update: {},
    create: { id: DEFAULT_BOARD_ID, ownerId: owner.id },
  });

  // Memberships: owner can manage, viewer is read-only.
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: owner.id } },
    update: { role: "owner" },
    create: { boardId: board.id, userId: owner.id, role: "owner" },
  });
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: viewer.id } },
    update: { role: "viewer" },
    create: { boardId: board.id, userId: viewer.id, role: "viewer" },
  });

  const existing = await prisma.card.count({ where: { boardId: board.id } });
  if (existing === 0) {
    await prisma.card.createMany({
      data: [
        { boardId: board.id, title: "Welcome to the board", column: "todo" },
        { boardId: board.id, title: "Drag me to Doing", column: "todo" },
        { boardId: board.id, title: "Open in two tabs to see realtime", column: "doing" },
        { boardId: board.id, title: "This is Done", column: "done" },
      ],
    });
  }

  console.log(`Seeded board ${board.id}`);
  console.log(`  owner  -> ${DEMO.owner.email} / ${DEMO.owner.password}`);
  console.log(`  viewer -> ${DEMO.viewer.email} / ${DEMO.viewer.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
