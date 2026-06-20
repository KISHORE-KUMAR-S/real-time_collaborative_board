// Socket.IO wiring. Clients join a per-board room; controllers broadcast
// final persisted state into that room after each successful write.
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { config } from "../config";
import { CardDTO, SOCKET_EVENTS } from "../types";
import { verifyToken } from "../auth/jwt";
import { getMemberRole } from "../repositories/membershipRepository";

export const boardRoom = (boardId: string) => `board:${boardId}`;

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  // Handshake auth: the socket must present a valid token, same as REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.data.userId = verifyToken(token).sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.joinBoard, async (boardId: string) => {
      if (typeof boardId !== "string" || !boardId) return;
      // The room is the read-authorization boundary: only members join it, so
      // only members receive broadcasts.
      const role = await getMemberRole(boardId, socket.data.userId);
      if (!role) return;
      socket.join(boardRoom(boardId));
    });
  });

  return io;
}

function emit(boardId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(boardRoom(boardId)).emit(event, payload);
}

// Broadcast helpers used by controllers. The actor receives the event too;
// the client reconciles idempotently against React Query cache.
export const broadcast = {
  cardCreated: (card: CardDTO) =>
    emit(card.boardId, SOCKET_EVENTS.cardCreated, card),
  cardUpdated: (card: CardDTO) =>
    emit(card.boardId, SOCKET_EVENTS.cardUpdated, card),
  cardDeleted: (boardId: string, cardId: string) =>
    emit(boardId, SOCKET_EVENTS.cardDeleted, { id: cardId }),
};
