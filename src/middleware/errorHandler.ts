import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof Error) {
    if ((err as { status?: number }).status === 429) {
      res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests" } });
      return;
    }
    if (err.message.includes("Unexpected field") || err.message.includes("LIMIT_FILE_SIZE")) {
      res.status(400).json({ error: { code: "INVALID_IMAGE", message: err.message } });
      return;
    }
  }
  console.error(`[error] ${err instanceof Error ? err.stack || err.message : String(err)}`);
  res.status(500).json({ error: { code: "DATABASE_ERROR", message: "Internal server error" } });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
}
