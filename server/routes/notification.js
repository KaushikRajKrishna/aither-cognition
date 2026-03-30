import { Router } from "express";
import { subscribe, unsubscribe, getVapidPublicKey } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/vapid-public-key", getVapidPublicKey);
router.post("/subscribe", protect, subscribe);
router.delete("/subscribe", protect, unsubscribe);

export default router;
