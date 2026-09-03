import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import receiptsRouter from "./routes/receipts";
import analyticsRouter from "./routes/analytics";
import debugRouter from "./routes/debug";
import trainingRouter from "./routes/training";
import convoRouter from "./routes/convo";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { sanitizeInput, noCache } from "./middleware/security";
import { receiptRepository } from "./repositories/receiptRepository";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(sanitizeInput);
  app.use(noCache);
  app.set("trust proxy", 1);

  const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxGeneral,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
  });

  const uploadLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxUploads,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many uploads, try again later" } },
  });

  app.use(generalLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/usage", (req, res) => {
    const userId = (req.headers["x-user-id"] as string) || "user_demo";
    const used = receiptRepository.getUsage(userId);
    res.json({ used, limit: config.subscription.freeScansPerMonth, remaining: Math.max(0, config.subscription.freeScansPerMonth - used) });
  });

  app.use("/uploads", express.static("uploads"));

  app.use("/api/receipts", uploadLimiter, receiptsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/items", analyticsRouter);
  if (process.env.NODE_ENV !== "production") app.use("/api/debug", debugRouter);
  app.use("/api/training", trainingRouter);
  app.use("/api/convo", convoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
