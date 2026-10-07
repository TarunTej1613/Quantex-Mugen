import { Router } from "express";
import { submitPayment } from "../controllers/paymentController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/submit", requireAuth, submitPayment);

export default router;
