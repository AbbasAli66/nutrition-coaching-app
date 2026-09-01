import { Router } from "express";
import { 
  upsertNutritionPlan, 
  getActivePlan, 
  getCoachClients 
} from "../controllers/planController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/active", authenticateToken, getActivePlan);
router.get("/clients", authenticateToken, authorizeRoles("COACH"), getCoachClients);
router.get("/client/:userId", authenticateToken, authorizeRoles("COACH"), getActivePlan);
router.post("/", authenticateToken, authorizeRoles("COACH"), upsertNutritionPlan);

export default router;