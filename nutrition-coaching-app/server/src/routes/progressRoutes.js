import { Router } from "express";
import {
    addCheckIn,
    getProgressHistory,
    getCoachClients,
}
from "../controllers/progressController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();
//client routers
router.post("/checkIn", authenticateToken, addCheckIn);
router.get("/history", authenticateToken, getProgressHistory);

//coach specific routes
router.get("/coach/clients", authenticateToken, authorizeRoles("COACH"), getCoachClients);
router.get("/history/:userId", authenticateToken, authorizeRoles("COACH"), getProgressHistory);
export default router;