import express from "express";
import { chat } from "../controllers/chatController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/chat  — protected: user must be logged in
router.post("/", protect, chat);

export default router;
