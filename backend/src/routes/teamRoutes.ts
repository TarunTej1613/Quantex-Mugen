import { Router } from "express";
import { registerTeam, getTeamById, checkTeamNameAvailability } from "../controllers/teamController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.get("/check-name", checkTeamNameAvailability);
router.post("/check-name", checkTeamNameAvailability);
router.post("/register", requireAuth, registerTeam);
router.get("/:teamId", getTeamById);

export default router;
