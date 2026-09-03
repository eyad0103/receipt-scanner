import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getItemHistory, getOverview } from "../controllers/analyticsController";

const router = Router();
router.use(authMiddleware);

router.get("/overview", (req, res, next) => {
  getOverview(req as never, res).catch(next);
});

router.get("/items/:itemName/history", (req, res, next) => {
  getItemHistory(req as never, res).catch(next);
});

export default router;
