import express from "express";
import {
  getUserChatHistory,
  getFlaggedMessages,
  getConversationTranscript,
  markAsReviewed,
  getConversationStats,
  exportConversation,
} from "../controllers/chatHistoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── User routes (protected) ───────────────────────────────────────────────
// GET /api/chat-history/:userId — Get chat history for a user
router.get("/:userId/history", protect, getUserChatHistory);

// GET /api/chat-history/:userId/stats — Get conversation statistics
router.get("/:userId/stats", protect, getConversationStats);

// GET /api/chat-history/:sessionId/transcript — Get conversation transcript
router.get("/:sessionId/transcript", protect, getConversationTranscript);

// GET /api/chat-history/:sessionId/export — Export conversation
router.get("/:sessionId/export", protect, exportConversation);

// ── Admin routes (protected + admin role) ─────────────────────────────────
// GET /api/chat-history/admin/flagged — Get flagged high-risk messages
router.get("/admin/flagged-messages", protect, getFlaggedMessages);

// POST /api/chat-history/:messageId/review — Mark message as reviewed
router.post("/:messageId/review", protect, markAsReviewed);

export default router;
