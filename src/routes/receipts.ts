import { Router } from "express";
import multer from "multer";
import { config } from "../config";
import { authMiddleware } from "../middleware/auth";
import { getReceipt, listReceipts, patchReceipt, uploadReceipt } from "../controllers/receiptController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

const router = Router();

router.use(authMiddleware);

router.post("/upload", upload.single("image"), (req, res, next) => {
  uploadReceipt(req as never, res).catch(next);
});

router.get("/", (req, res, next) => {
  listReceipts(req as never, res).catch(next);
});

router.get("/:receiptId", (req, res, next) => {
  getReceipt(req as never, res).catch(next);
});

router.patch("/:receiptId", (req, res, next) => {
  patchReceipt(req as never, res).catch(next);
});

export default router;
