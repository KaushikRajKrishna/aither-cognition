import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/mood  — log a mood entry
router.post("/", protect, async (req, res) => {
  try {
    const { mood, note } = req.body;
    const user = await User.findById(req.user._id);
    user.moodHistory.push({ mood, note });
    await user.save();
    res.status(201).json({ moodHistory: user.moodHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/mood  — get mood history
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("moodHistory");
    res.json({ moodHistory: user.moodHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
