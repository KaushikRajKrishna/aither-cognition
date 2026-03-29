import express from "express";
import MoodService from "../services/moodService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/mood/add — log a mood entry with advanced analysis
router.post("/add", protect, async (req, res) => {
  try {
    const { mood, note = "" } = req.body;

    // Basic validation
    if (!mood) {
      return res.status(400).json({
        error: "Mood is required",
        code: "MISSING_MOOD"
      });
    }

    if (!["happy", "calm", "neutral", "stressed", "sad"].includes(mood)) {
      return res.status(400).json({
        error: "Invalid mood type. Must be: happy, calm, neutral, stressed, or sad",
        code: "INVALID_MOOD"
      });
    }

    if (note && note.length > 500) {
      return res.status(400).json({
        error: "Note cannot exceed 500 characters",
        code: "NOTE_TOO_LONG"
      });
    }

    const moodEntry = await MoodService.addMoodEntry(req.user._id, mood, note);

    res.status(201).json({
      moodId: moodEntry.moodId,
      mood: moodEntry.mood,
      moodScore: moodEntry.moodScore,
      note: moodEntry.note,
      detectedMood: moodEntry.detectedMood,
      sentimentScore: moodEntry.sentimentScore,
      createdAt: moodEntry.createdAt,
    });
  } catch (err) {
    console.error("Error adding mood entry:", err);
    res.status(500).json({
      error: "Failed to add mood entry",
      message: err.message,
      code: "MOOD_ADD_FAILED"
    });
  }
});

// GET /api/mood/history — get mood history with pagination
router.get("/history", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 365);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const result = await MoodService.getMoodHistory(req.user._id, limit, offset);

    res.json(result);
  } catch (err) {
    console.error("Error getting mood history:", err);
    res.status(500).json({
      error: "Failed to retrieve mood history",
      message: err.message,
      code: "HISTORY_RETRIEVAL_FAILED"
    });
  }
});

// GET /api/mood/analysis — analyze mood patterns and trends
router.get("/analysis", protect, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 365);

    const analysis = await MoodService.analyzeMood(req.user._id, days);

    res.json(analysis);
  } catch (err) {
    console.error("Error analyzing mood:", err);
    res.status(500).json({
      error: "Failed to analyze mood patterns",
      message: err.message,
      code: "ANALYSIS_FAILED"
    });
  }
});

// GET /api/mood/weekly-report — generate weekly mood report
router.get("/weekly-report", protect, async (req, res) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset) || 0;

    if (weekOffset < 0 || weekOffset > 52) {
      return res.status(400).json({
        error: "Week offset must be between 0 and 52",
        code: "INVALID_WEEK_OFFSET"
      });
    }

    const report = await MoodService.getWeeklyReport(req.user._id, weekOffset);

    res.json(report);
  } catch (err) {
    console.error("Error generating weekly report:", err);
    res.status(500).json({
      error: "Failed to generate weekly report",
      message: err.message,
      code: "WEEKLY_REPORT_FAILED"
    });
  }
});

// GET /api/mood/alerts — get active alerts
router.get("/alerts", protect, async (req, res) => {
  try {
    const alerts = await MoodService.getActiveAlerts(req.user._id);

    res.json({
      alerts,
      count: alerts.length,
    });
  } catch (err) {
    console.error("Error getting alerts:", err);
    res.status(500).json({
      error: "Failed to retrieve alerts",
      message: err.message,
      code: "ALERTS_RETRIEVAL_FAILED"
    });
  }
});

// PUT /api/mood/alerts/:alertId/resolve — resolve an alert
router.put("/alerts/:alertId/resolve", protect, async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await MoodService.resolveAlert(req.user._id, alertId);

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
        code: "ALERT_NOT_FOUND"
      });
    }

    res.json({
      alertId: alert.alertId,
      alertType: alert.alertType,
      resolved: true,
      resolvedAt: alert.resolvedAt,
    });
  } catch (err) {
    console.error("Error resolving alert:", err);
    res.status(500).json({
      error: "Failed to resolve alert",
      message: err.message,
      code: "ALERT_RESOLVE_FAILED"
    });
  }
});

// GET /api/mood/health — service health check
router.get("/health", async (req, res) => {
  try {
    // Check database connectivity
    const mongoose = (await import("mongoose")).default;
    const isConnected = mongoose.connection.readyState === 1;

    res.json({
      status: isConnected ? "healthy" : "unhealthy",
      service: "Mood Tracking Service",
      database: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({
      status: "unhealthy",
      service: "Mood Tracking Service",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Legacy endpoint for backward compatibility
// POST /api/mood — log a mood entry (simple version)
router.post("/", protect, async (req, res) => {
  try {
    const { mood, note = "" } = req.body;

    if (!mood) {
      return res.status(400).json({ message: "Mood is required" });
    }

    // Use the new service but maintain backward compatibility
    const moodEntry = await MoodService.addMoodEntry(req.user._id, mood, note);

    // Return legacy format
    const user = await (await import("../models/User.js")).default.findById(req.user._id);
    res.status(201).json({ moodHistory: user.moodHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy endpoint for backward compatibility
// GET /api/mood — get mood history (simple version)
router.get("/", protect, async (req, res) => {
  try {
    const user = await (await import("../models/User.js")).default.findById(req.user._id).select("moodHistory");
    res.json({ moodHistory: user.moodHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
