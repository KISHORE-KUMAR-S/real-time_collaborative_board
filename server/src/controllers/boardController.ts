import { Request, Response } from "express";
import { getBoardForUser } from "../repositories/boardRepository";
import { HttpError } from "../middleware/errorHandler";

// GET /api/boards/:id  (requireBoardRole has already set req.boardRole)
export async function getBoardHandler(req: Request, res: Response) {
  const board = await getBoardForUser(req.params.id, req.boardRole!);
  if (!board) throw new HttpError(404, "Board not found");
  res.json(board);
}
