import { Router } from "express";
import { addDailyLog, getDailyLogByDate } from "../controllers/logController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
router.post("/", authenticateToken, addDailyLog);
router.get("/", authenticateToken, getDailyLogByDate);

export default router;