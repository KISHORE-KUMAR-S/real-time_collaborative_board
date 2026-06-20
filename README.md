# Real-Time Collaborative Kanban Board

A small, production-shaped MVP of a real-time collaborative Kanban board. One board, three columns (**Todo / Doing / Done**), cards you can create, edit, move, and delete — and every change shows up live for everyone viewing the board, no refresh needed.

## Stack

| Layer     | Tech                                            |
| --------- | ----------------------------------------------- |
| Frontend  | React + TypeScript, Vite, Tailwind + shadcn/ui, TanStack Query |
| Backend   | Node.js + TypeScript, Express                    |
| Realtime  | Socket.IO (rooms: `board:<boardId>`)            |
| Database  | MySQL                                            |
| ORM       | Prisma                                           |
| Validation| Zod                                             |

See [`DECISIONS.md`](./DECISIONS.md) for the architecture and the reasoning behind the trade-offs.

---

## Quick start (Docker — recommended)

Requires Docker + Docker Compose.

```bash
docker compose up --build
```

This starts three services:

- **mysql** on `localhost:3306`
- **backend** (REST + Socket.IO) on `localhost:4000` — syncs the schema and seeds the default board on boot
- **frontend** (nginx) on **http://localhost:8080**

Open **http://localhost:8080** in two browser tabs and watch changes sync live.

---

## Local development (without Docker)

You need a running MySQL instance.

### 1. Backend

```bash
cd server
cp .env.example .env          # edit DATABASE_URL to point at your MySQL
npm install
npm run prisma:generate
npx prisma db push            # create tables from schema
npm run seed                  # create the default board + sample cards
npm run dev                   # http://localhost:4000
```

### 2. Frontend

```bash
cd client
cp .env.example .env          # VITE_API_URL defaults to http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Open **http://localhost:5173** in two tabs.

---

## Auth & roles

The app uses JWT auth with **permission-based RBAC**, scoped per board. Sign up, or use the seeded demo accounts:

| Account | Email | Password | Role |
| ------- | ----- | -------- | ---- |
| Owner   | `owner@board.test`  | `password123` | owner (full control + member management) |
| Viewer  | `viewer@board.test` | `password123` | viewer (read-only) |

Roles → permissions:

- **viewer** — read board
- **editor** — viewer + create / edit / move / delete cards
- **owner** — editor + manage members + board settings

Sign in as the viewer in a second browser to see read-only gating; sign in as the owner to open **Members** and change roles live.

## API

All routes are under `/api/v1`. Everything except signup/login requires `Authorization: Bearer <token>`; board/card/member routes additionally require the matching permission on the target board.

| Method | Route                              | Permission      | Purpose                          |
| ------ | --------------------------------- | --------------- | -------------------------------- |
| POST   | `/api/v1/auth/signup`             | —               | Create account, returns token    |
| POST   | `/api/v1/auth/login`              | —               | Log in, returns token            |
| GET    | `/api/v1/auth/me`                 | (authenticated) | Current user + their boards      |
| GET    | `/api/v1/boards/:id`              | `board:read`    | Board + cards + your permissions |
| POST   | `/api/v1/cards`                   | `card:create`   | Create card                      |
| PATCH  | `/api/v1/cards/:id`               | `card:update`   | Edit title and/or move column    |
| DELETE | `/api/v1/cards/:id`               | `card:delete`   | Delete card                      |
| GET    | `/api/v1/boards/:id/members`      | `member:read`   | List members                     |
| POST   | `/api/v1/boards/:id/members`      | `member:manage` | Add member by email              |
| PATCH  | `/api/v1/boards/:id/members/:uid` | `member:manage` | Change member role               |
| DELETE | `/api/v1/boards/:id/members/:uid` | `member:manage` | Remove member                    |
| GET    | `/health`                         | —               | Health check                     |

**Socket events** (handshake requires a valid JWT in `auth.token`; `join-board` requires board membership)

- Client → Server: `join-board` (payload: `boardId`)
- Server → Client: `card-created`, `card-updated`, `card-deleted`

---

## How realtime works (short version)

1. On load the client `GET`s board state and renders it (DB is the source of truth).
2. The client connects to Socket.IO and emits `join-board`.
3. Any mutation hits REST → the server persists it → the server broadcasts the **final persisted state** to the `board:<id>` room.
4. Every client (including the actor) applies the broadcast to its TanStack Query cache idempotently.
5. On disconnect the client auto-reconnects, **rejoins the room, and refetches** the board so it can't drift from anything missed while offline.

---

## Project structure

```
server/                     client/
  src/                        src/
    routes/                     components/   (TaskCard, Column, CardForm, MembersDialog, ui/)
    controllers/                pages/        (BoardPage, LoginPage)
    repositories/               hooks/        (useBoard, useCardMutations)
    validation/                 services/     (api, socket, authToken)
    auth/        (jwt,          providers/    (AuthProvider, SocketProvider)
      permissions)              types/
    sockets/
    middleware/  (auth, error)
    prisma/
  prisma/ (schema + seed)
```

## Notes / what I'd do next

See the **Scaling Discussion** in `DECISIONS.md` — presence, optimistic updates, a Redis Socket.IO adapter for horizontal scaling, activity history, and stronger conflict handling (per-field LWW / CRDT) are the next steps I'd take given more time.
