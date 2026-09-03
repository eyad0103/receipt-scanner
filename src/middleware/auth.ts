import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Errors } from "../utils/errors";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
      req.userId = payload.userId;
      next();
      return;
    } catch {
      next(Errors.unauthorized("Invalid token"));
      return;
    }
  }
  const fallback = (req.headers["x-user-id"] as string) || (req.query.userId as string);
  if (fallback) {
    req.userId = String(fallback);
    next();
    return;
  }
  req.userId = "user_demo";
  next();
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.userId) {
    next(Errors.unauthorized());
    return;
  }
  next();
}
