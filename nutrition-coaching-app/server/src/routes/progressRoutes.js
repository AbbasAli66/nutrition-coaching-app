import { Router } from "express";
import {
  submitCheckIn,
  getClientCheckIns,
  getPendingCheckIns,
  reviewCheckIn,
} from "../controllers/progressController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

// Client routes
router.post("/check-in", authenticateToken, submitCheckIn);
router.post("/checkIn", authenticateToken, submitCheckIn);
router.get("/history", authenticateToken, getClientCheckIns);

// Coach routes
router.get(
  "/coach/pending",
  authenticateToken,
  authorizeRoles("COACH"),
  getPendingCheckIns
);

router.patch(
  "/coach/review/:checkInId",
  authenticateToken,
  authorizeRoles("COACH"),
  reviewCheckIn
);

router.get(
  "/history/:userId",
  authenticateToken,
  authorizeRoles("COACH"),
  getClientCheckIns
);

export default router;