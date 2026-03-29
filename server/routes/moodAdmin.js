import express from "express";
import MoodUtils from "../services/moodUtils.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/mood-admin/generate-sample — generate sample data for testing
router.post("/generate-sample", async (req, res) => {
  try {
    const { count = 100 } = req.body;

    if (count < 1 || count > 1000) {
      return res.status(400).json({
        error: "Count must be between 1 and 1000",
        code: "INVALID_COUNT"
      });
    }

    const result = await MoodUtils.generateSampleData(req.user._id, count);

    res.json(result);
  } catch (err) {
    console.error("Error generating sample data:", err);
    res.status(500).json({
      error: "Failed to generate sample data",
      message: err.message,
      code: "SAMPLE_GENERATION_FAILED"
    });
  }
});

// DELETE /api/mood-admin/cleanup — clean up old data
router.delete("/cleanup", async (req, res) => {
  try {
    const { days = 90 } = req.body;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        error: "Days must be between 1 and 365",
        code: "INVALID_DAYS"
      });
    }

    const result = await MoodUtils.cleanupOldData(req.user._id, days);

    res.json(result);
  } catch (err) {
    console.error("Error cleaning up data:", err);
    res.status(500).json({
      error: "Failed to cleanup data",
      message: err.message,
      code: "CLEANUP_FAILED"
    });
  }
});

// GET /api/mood-admin/export — export user data
router.get("/export", async (req, res) => {
  try {
    const { filename } = req.query;

    const result = await MoodUtils.exportUserData(req.user._id, filename);

    res.json(result);
  } catch (err) {
    console.error("Error exporting data:", err);
    res.status(500).json({
      error: "Failed to export data",
      message: err.message,
      code: "EXPORT_FAILED"
    });
  }
});

// GET /api/mood-admin/stats — get database statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await MoodUtils.getDatabaseStats();

    res.json(stats);
  } catch (err) {
    console.error("Error getting stats:", err);
    res.status(500).json({
      error: "Failed to get statistics",
      message: err.message,
      code: "STATS_FAILED"
    });
  }
});

// GET /api/mood-admin/diagnostics — run system diagnostics
router.get("/diagnostics", async (req, res) => {
  try {
    const diagnostics = await MoodUtils.runDiagnostics();

    res.json(diagnostics);
  } catch (err) {
    console.error("Diagnostics failed:", err);
    res.status(500).json({
      error: "Diagnostics failed",
      message: err.message,
      code: "DIAGNOSTICS_FAILED"
    });
  }
});

// POST /api/mood-admin/backup — create database backup
router.post("/backup", async (req, res) => {
  try {
    const { backupDir = "backups" } = req.body;

    const result = await MoodUtils.createBackup(backupDir);

    res.json(result);
  } catch (err) {
    console.error("Backup failed:", err);
    res.status(500).json({
      error: "Backup failed",
      message: err.message,
      code: "BACKUP_FAILED"
    });
  }
});

// GET /api/mood-admin/insights — get advanced user insights
router.get("/insights", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    if (days < 7 || days > 365) {
      return res.status(400).json({
        error: "Days must be between 7 and 365",
        code: "INVALID_DAYS_RANGE"
      });
    }

    const insights = await MoodUtils.getUserInsights(req.user._id, parseInt(days));

    res.json(insights);
  } catch (err) {
    console.error("Error getting insights:", err);
    res.status(500).json({
      error: "Failed to get insights",
      message: err.message,
      code: "INSIGHTS_FAILED"
    });
  }
});

export default router;