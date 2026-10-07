import { Router } from "express";
import { getCapacity } from "../controllers/capacityController";

const router = Router();

router.get("/", getCapacity);

export default router;
