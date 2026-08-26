import { Router } from "express";
import { upsertNutritionPlan, getActivePlan } from "../controllers/planController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

// Coach creates/updates a client plan
router.post("/", authenticateToken, authorizeRoles("COACH"), upsertNutritionPlan);

// Get current active plan
router.get("/active", authenticateToken, getActivePlan);
router.get("/client/:userId", authenticateToken, authorizeRoles("COACH"), getActivePlan);

export default router;