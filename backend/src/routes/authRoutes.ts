import { Router } from "express";
import { googleLogin, getMe, logout } from "../controllers/authController";

const router = Router();

router.post("/google-login", googleLogin);
router.get("/me", getMe);
router.post("/logout", logout);

export default router;
