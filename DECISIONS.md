# DECISIONS

This document explains *how* and *why* the collaborative board is built the way it is. The goal was a correct, simple, readable MVP — not a feature-complete product. Where I cut scope, I say so and describe what I'd do next.

---

## Architecture

### Why REST + Socket.IO (rather than one or the other)

I split the two jobs by their nature:

- **REST** handles *commands and authoritative reads*: create/update/delete a card, and fetch the full board on load. Requests are easy to validate (Zod), easy to test with `curl`, return clear status codes, and map cleanly to Prisma writes. The initial board load and the reconnection refetch both go through `GET /api/boards/:id`, which is the canonical "current truth" endpoint.
- **Socket.IO** handles *fan-out*: once a write is committed, every other viewer needs to hear about it. That's a push problem, which HTTP request/response is bad at. Socket.IO gives rooms, automatic reconnection, and a clean event model out of the box.

Mutations therefore flow **through REST, not through sockets**. The client sends `POST/PATCH/DELETE`; the server persists, then broadcasts. I deliberately did **not** accept card writes over the socket. Keeping a single write path means there's exactly one place where validation, persistence, and broadcasting happen — which is the whole reason the realtime behavior stays predictable.

The layering on the backend (`routes → controllers → services → prisma`) keeps each concern small: routes wire URLs, controllers validate + orchestrate + broadcast, services own persistence. The socket layer is a thin broadcast helper the controllers call.

---

## Realtime Design

### How an update flows through the system

```text
User A: drag card to "Doing"
   │
   ├─ PATCH /api/cards/:id  { column: "doing" }
   │
Server
   ├─ Zod validates body
   ├─ Prisma updates row  (updatedAt bumped)  ← persisted truth
   ├─ responds 200 with final card to User A
   └─ broadcast "card-updated" (final card) to room board:<id>
   │
All clients in the room (A, B, C…)
   └─ SocketProvider applies the card to the TanStack Query cache
        (upsert by id) → components re-render
```

Key choices:

- **The broadcast carries the final persisted state**, not a diff or an intent. Clients don't recompute anything — they just store what the server says. This makes every client converge on the same bytes the database holds.
- **The actor also receives its own broadcast.** Rather than special-casing "did I cause this?", every client treats incoming events identically and applies them idempotently (upsert by `id`, remove by `id`). That removes a whole class of "my own change applied twice" bugs.
- **No optimistic UI in this MVP.** A mutation waits for the server round-trip and then the broadcast updates the cache. This keeps the data flow single-path and easy to reason about. The cost is a small perceived latency on your own actions; see Scaling for how I'd add optimistic updates safely.
- **Cache as the single store.** TanStack Query holds board state. The query is the read path; socket events are the write path into the cache. No Redux, no second source of state to keep in sync.

---

## Conflict Resolution

### Last Write Wins — and why it's the right call here

When two users edit the same card at nearly the same time, the rule is simple: **the write that reaches the database last wins, and that final state is broadcast to everyone.**

This falls out naturally from the design:

- Each `PATCH` is an unconditional overwrite of the provided fields, and Prisma bumps `updatedAt` on every write.
- Whichever request the database commits last is the state that exists afterward.
- That same committed state is what gets broadcast, so all clients — including both editors — end up showing the winner.

**Why LWW and not something stronger:**

- The data is low-stakes and small: a card has a title and a column. There's no merge that's obviously "more correct" than just taking the latest value. Losing a half-second-old title edit is acceptable; the cost of getting fancy is not.
- LWW requires **no coordination, no locks, no version vectors**. It's the simplest rule that's still predictable, which matches the non-functional priorities (simplicity, readability, reliability).
- It's predictable to *users*: the last person to act sees their change stick, and everyone else snaps to it live.

**Known limitation (honest):** LWW is *whole-field* per request. If User A edits the title while User B moves the column at the same instant, each `PATCH` only sends the field it changed, so they don't clobber each other — but if both edit the *same* field, the later one wins outright and the earlier edit is lost with no warning. That's the documented, accepted trade-off for this MVP. Per-field merging or CRDTs (below) would remove it.

---

## Reconnection Handling

### How stale state is recovered

Websocket events are treated as a **fast path, never the source of truth.** The database is. That distinction is what makes reconnection safe.

On the client (`SocketProvider`):

1. Socket.IO auto-reconnects with bounded backoff (`reconnectionDelay` 500ms → max 5s, infinite retries).
2. On **every** `connect`/`reconnect` event, the client does two things:
   - re-emits `join-board` to rejoin the room (a reconnect is a new socket, so old room membership is gone), and
   - **invalidates the board query**, forcing a fresh `GET /api/boards/:id`.

That refetch is the crucial part: any `card-created/updated/deleted` events that fired while the socket was down are simply *missed* — and we don't try to replay them. Instead we re-pull the whole board, which by definition reflects every change that happened during the outage. The client cannot silently drift.

This is why I didn't build an event log / "give me everything since timestamp T" mechanism: refetching the full board is dead simple, always correct, and the payload is tiny at this scale. It'd be the wrong choice for a huge board (see Scaling), but it's the right choice here.

---

## Scaling Discussion

These are intentionally **not implemented** — they're what I'd reach for next, with the trade-offs that would drive the decision.

### Presence indicators ("who else is here")

Track sockets per room and broadcast a roster on join/leave. Cheap and high-value. The trade-off is mostly lifecycle bookkeeping (debouncing flaps on flaky connections) and, once you scale horizontally, presence has to live somewhere shared (Redis) rather than in one process's memory.

### Activity history

Append an immutable `activity` row per mutation (who/what/when) and expose a feed. Low risk, additive. Trade-off: write amplification and retention/pruning policy. It also becomes the foundation for "replay since T" reconnection if full-board refetch ever gets too big.

### Optimistic updates

Apply the change to the cache immediately, before the server responds, and roll back on error. Big perceived-latency win on your own actions. The trade-off is complexity: you need rollback, and you need to reconcile the optimistic value against the authoritative broadcast (especially under LWW, where the server might overwrite your optimistic value with someone else's later write). Doable, but it adds exactly the kind of multi-path state I kept out of the MVP on purpose.

### Redis adapter for Socket.IO

With more than one backend instance, a broadcast from instance A won't reach clients connected to instance B. The `@socket.io/redis-adapter` pub/subs events across instances so rooms work cluster-wide. Trade-off: Redis becomes an operational dependency and a thing that can fail; for a single instance it's pure overhead, which is why it's out now.

### Horizontal scaling

Backend is stateless except for socket connections, so it scales out behind a load balancer **once** the Redis adapter is in place and sticky sessions (or WebSocket-only transport) are configured so a client stays pinned to one instance. MySQL becomes the next bottleneck; read replicas for the board fetch would come before anything exotic.

### Event sourcing

Model the board as an append-only log of events, deriving current state by folding them. Gives perfect history, time-travel, and trivially-correct "since T" reconnection. Trade-off: it's a large complexity jump — snapshots, replay performance, schema-evolution of events — that's hard to justify for a three-column board. The activity log above gets 80% of the value for 5% of the cost.

### CRDT-based collaboration

Replace LWW with a conflict-free replicated data type so concurrent edits *merge* instead of one clobbering the other (think live co-editing of a card title, character by character). This is the real fix for LWW's lost-update limitation. Trade-off: substantial conceptual and library complexity (e.g. Yjs), larger payloads, and it's overkill unless cards hold rich collaboratively-edited text. For titles and column moves, LWW is the right amount of correctness.

---

## Authentication & RBAC (implemented)

The original brief said *no authentication required*. It was added afterwards as a deliberate extension, built as a **permission-based** RBAC system (not just role checks) so the authorization policy lives in exactly one place and every enforcement point asks the same question: *does this role grant this permission?*

### Data model

```text
User        id, email, name, password_hash, created_at
Board       id, owner_id (FK User), created_at, updated_at
BoardMember board_id (FK), user_id (FK), role ENUM('owner','editor','viewer')
            PRIMARY KEY (board_id, user_id)   -- one role per user per board
            INDEX (user_id)                   -- "boards I belong to"
```

Roles are scoped **per board**, not global — the same user can be an editor on one board and a viewer on another. That's why the role lives on the `BoardMember` join row, not on `User`.

### Permissions, not roles, at the call site

The policy is a single map (`server/src/auth/permissions.ts`):

```text
Permission   = board:read | board:update | board:delete
             | card:create | card:update | card:delete
             | member:read | member:manage

viewer → board:read, member:read
editor → viewer + card:create, card:update, card:delete
owner  → editor + board:update, board:delete, member:manage
```

Every guard checks a **permission** (`requirePermission("card:update", …)`), never a role name. Adding a role, or moving a capability between roles, is a one-line change in that map — no route or component touched. Roles are just named bundles of permissions.

### Enforcement points (defense in depth)

Authorization holds on **both** transports, because either can move data:

1. **REST** — `authenticate` middleware verifies the Bearer JWT and sets `req.userId`. `requirePermission(perm, resolveBoardId)` then loads the user's `BoardMember` role for the target board and rejects `403` unless the role grants `perm`. The board id is resolved per route — from `params` (board routes), `body.boardId` (card create), or the card row itself (card update/delete).
2. **Socket.IO** — `io.use()` handshake middleware verifies the same JWT (token on `socket.handshake.auth`), and `join-board` checks membership **before** `socket.join(room)`. A non-member never enters the room, so never receives broadcasts — the room *is* the read-authorization boundary.

The board fetch returns the caller's `role` **and** their resolved `permissions[]`, so the client gates UI off the exact same policy the server enforces (hide the add-card form without `card:create`, the member panel without `member:manage`, etc.). UI gating is UX only — the server remains the sole security boundary.

### Member management

Owners manage membership via `member:manage`-guarded endpoints: list members, add an existing user by email, change a role, remove. A **last-owner invariant** is enforced server-side — the final owner can't be demoted or removed, so a board can never become unmanageable.

### Trade-offs

- **Roles resolved fresh per request**, not cached in the JWT — a role change takes effect immediately. The cost is one indexed `BoardMember` lookup per call, cheap at this scale; a hot path would cache it with short TTL.
- **JWT over server sessions** — stateless, so it scales horizontally with no shared session store. The trade-off is no server-side revocation before expiry; a token denylist (Redis) is the standard fix when needed.
- **Add-by-existing-email only** — no email invitation flow. Keeps scope tight; an invite token + signup-on-accept is the obvious next step.
- **bcrypt** for password hashing (cost 10) — fine default; argon2id would be the upgrade.

This slotted cleanly onto the existing architecture precisely *because* the read/write paths were already separated: two chokepoints (REST writes, room reads) were all that needed guarding.

---

## Summary of deliberate cuts

- Permission-based RBAC added as an extension (JWT auth, per-board roles, member management) — single board id, no email-invite flow yet.
- No optimistic UI — chose single-path correctness over perceived latency.
- `prisma db push` instead of a migration history — fine for a take-home, not for prod.
- Whole-field LWW — accepted lost-update on the same field by the same beat.
- Single backend instance — no Redis adapter yet.

Each of these is a place I traded scope for clarity, and each has a clear upgrade path above.
