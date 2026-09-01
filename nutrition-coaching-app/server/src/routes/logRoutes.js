import { Router } from "express";
import {
  getDailyLog,
  addMealItem,
  deleteMealItem,
  updateDailyMetrics,
} from "../controllers/logController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Log meal items (supports both /api/logs/meal and /api/logs)
router.post("/meal", authenticateToken, addMealItem);
router.post("/", authenticateToken, addMealItem);

// Delete meal item
router.delete("/meal/:mealId", authenticateToken, deleteMealItem);

// Daily water and weight metrics
router.patch("/metrics", authenticateToken, updateDailyMetrics);

// Fetch daily logs and macro progress
router.get("/today", authenticateToken, getDailyLog);
router.get("/:date", authenticateToken, getDailyLog);
router.get("/", authenticateToken, getDailyLog);

export default router;