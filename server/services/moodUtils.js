import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import MoodEntry from "../models/MoodEntry.js";
import Alert from "../models/Alert.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

class MoodUtils {
  // Generate sample data for testing
  static async generateSampleData(userId, count = 100) {
    try {
      const moods = ["happy", "calm", "neutral", "stressed", "sad"];
      const sampleNotes = [
        "Feeling great today!",
        "A bit stressed with work",
        "Just an ordinary day",
        "Had a wonderful time with friends",
        "Feeling a bit down",
        "Excited about the weekend",
        "Dealing with some anxiety",
        "Peaceful and content",
        "Overwhelmed with tasks",
        "Grateful for good health",
      ];

      const entries = [];

      for (let i = 0; i < count; i++) {
        const mood = moods[Math.floor(Math.random() * moods.length)];
        const note = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        entries.push({
          moodId: uuidv4(),
          userId,
          mood,
          moodScore: this.getMoodScore(mood),
          note,
          createdAt,
        });
      }

      await MoodEntry.insertMany(entries);

      // Update user stats
      await User.findByIdAndUpdate(userId, {
        $inc: { totalMoodEntries: count },
        $set: { lastMoodEntry: new Date() },
      });

      return { message: `Generated ${count} sample mood entries`, count };
    } catch (error) {
      throw new Error(`Failed to generate sample data: ${error.message}`);
    }
  }

  // Get mood score from mood type
  static getMoodScore(mood) {
    const scores = {
      happy: 5,
      calm: 4,
      neutral: 3,
      stressed: 2,
      sad: 1,
    };
    return scores[mood] || 3;
  }

  // Clean up old data
  static async cleanupOldData(userId, days = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await MoodEntry.deleteMany({
        userId,
        createdAt: { $lt: cutoffDate },
      });

      return {
        message: `Deleted ${result.deletedCount} mood entries older than ${days} days`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw new Error(`Failed to cleanup old data: ${error.message}`);
    }
  }

  // Export user data to JSON
  static async exportUserData(userId, outputPath = null) {
    try {
      if (!outputPath) {
        outputPath = `user_${userId}_${new Date().toISOString().split('T')[0]}.json`;
      }

      // Get all mood entries
      const moodEntries = await MoodEntry.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      // Get all alerts
      const alerts = await Alert.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      // Get user profile
      const user = await User.findById(userId)
        .select("name email totalMoodEntries lastMoodEntry createdAt")
        .lean();

      const exportData = {
        exportDate: new Date().toISOString(),
        user: user,
        moodEntries: moodEntries.map(entry => ({
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
        alerts: alerts.map(alert => ({
          ...alert,
          createdAt: alert.createdAt.toISOString(),
          updatedAt: alert.updatedAt.toISOString(),
        })),
        summary: {
          totalEntries: moodEntries.length,
          totalAlerts: alerts.length,
          dateRange: moodEntries.length > 0 ? {
            earliest: moodEntries[moodEntries.length - 1].createdAt.toISOString(),
            latest: moodEntries[0].createdAt.toISOString(),
          } : null,
        },
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

      return {
        message: `Exported data to ${outputPath}`,
        filePath: outputPath,
        summary: exportData.summary,
      };
    } catch (error) {
      throw new Error(`Failed to export user data: ${error.message}`);
    }
  }

  // Get database statistics
  static async getDatabaseStats() {
    try {
      const moodCount = await MoodEntry.countDocuments();
      const alertCount = await Alert.countDocuments();
      const eventCount = await Event.countDocuments();
      const userCount = await User.countDocuments();

      // Mood distribution
      const moodStats = await MoodEntry.aggregate([
        { $group: { _id: "$mood", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Recent activity
      const recentEntries = await MoodEntry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name")
        .lean();

      return {
        collections: {
          moods: moodCount,
          alerts: alertCount,
          events: eventCount,
          users: userCount,
        },
        moodDistribution: moodStats,
        recentActivity: recentEntries.map(entry => ({
          user: entry.userId?.name || "Unknown",
          mood: entry.mood,
          createdAt: entry.createdAt.toISOString(),
        })),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }

  // Run system diagnostics
  static async runDiagnostics() {
    try {
      const mongoose = (await import("mongoose")).default;
      const dbConnected = mongoose.connection.readyState === 1;

      const stats = await this.getDatabaseStats();

      // Check for data consistency
      const usersWithMoods = await User.countDocuments({ totalMoodEntries: { $gt: 0 } });
      const actualMoodEntries = stats.collections.moods;

      const consistencyIssues = [];

      if (usersWithMoods > 0 && actualMoodEntries === 0) {
        consistencyIssues.push("Users have mood entries but no MoodEntry documents found");
      }

      // Check for orphaned data
      const validUserIds = await User.find().distinct("_id");
      const orphanedMoods = await MoodEntry.countDocuments({
        userId: { $nin: validUserIds }
      });

      if (orphanedMoods > 0) {
        consistencyIssues.push(`${orphanedMoods} mood entries belong to non-existent users`);
      }

      return {
        database: {
          connected: dbConnected,
          status: dbConnected ? "healthy" : "disconnected",
        },
        statistics: stats,
        consistency: {
          issues: consistencyIssues,
          status: consistencyIssues.length === 0 ? "good" : "issues_found",
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Diagnostics failed: ${error.message}`);
    }
  }

  // Backup database (simple JSON export)
  static async createBackup(backupDir = "backups") {
    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `mood_backup_${timestamp}`);

      await fs.mkdir(backupPath, { recursive: true });

      // Backup moods
      const moods = await MoodEntry.find().lean();
      await fs.writeFile(
        path.join(backupPath, "moods.json"),
        JSON.stringify(moods, null, 2)
      );

      // Backup alerts
      const alerts = await Alert.find().lean();
      await fs.writeFile(
        path.join(backupPath, "alerts.json"),
        JSON.stringify(alerts, null, 2)
      );

      // Backup events
      const events = await Event.find().lean();
      await fs.writeFile(
        path.join(backupPath, "events.json"),
        JSON.stringify(events, null, 2)
      );

      return {
        message: `Backup created in ${backupPath}`,
        path: backupPath,
        files: ["moods.json", "alerts.json", "events.json"],
        recordCounts: {
          moods: moods.length,
          alerts: alerts.length,
          events: events.length,
        },
      };
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  // Get user insights (advanced analytics)
  static async getUserInsights(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await MoodEntry.find({
        userId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 });

      if (entries.length === 0) {
        return {
          insights: ["No mood data available for analysis"],
          recommendations: ["Start logging your moods regularly"],
        };
      }

      const insights = [];
      const recommendations = [];

      // Average mood analysis
      const avgMood = entries.reduce((sum, entry) => sum + entry.moodScore, 0) / entries.length;
      if (avgMood >= 4) {
        insights.push("Your average mood is very positive");
        recommendations.push("Keep up the great work maintaining your positive outlook");
      } else if (avgMood >= 3) {
        insights.push("Your average mood is generally neutral to positive");
        recommendations.push("Consider activities that boost your mood further");
      } else if (avgMood >= 2) {
        insights.push("Your mood shows some stress or sadness");
        recommendations.push("Consider stress management techniques");
      } else {
        insights.push("Your mood indicates significant challenges");
        recommendations.push("Consider speaking with a mental health professional");
      }

      // Trend analysis
      const trend = this.calculateTrend(entries);
      insights.push(`Your mood trend over the last ${days} days is: ${trend}`);

      if (trend === "improving") {
        recommendations.push("Continue with whatever is working for you");
      } else if (trend === "declining") {
        recommendations.push("Consider identifying and addressing sources of stress");
      }

      // Pattern analysis
      const moodCounts = {};
      entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      });

      const dominantMood = Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b
      );

      insights.push(`Your most common mood is: ${dominantMood}`);

      // Stress analysis
      const stressDays = entries.filter(entry =>
        ["stressed", "sad"].includes(entry.mood)
      ).length;
      const stressPercentage = (stressDays / entries.length) * 100;

      if (stressPercentage > 50) {
        insights.push(`High stress levels detected (${stressPercentage.toFixed(1)}% of days)`);
        recommendations.push("Consider professional support for stress management");
      } else if (stressPercentage > 25) {
        insights.push(`Moderate stress levels (${stressPercentage.toFixed(1)}% of days)`);
        recommendations.push("Try relaxation techniques and self-care activities");
      }

      return {
        insights,
        recommendations,
        analysisPeriod: `${days} days`,
        dataPoints: entries.length,
      };
    } catch (error) {
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  // Calculate trend from entries
  static calculateTrend(entries) {
    if (entries.length < 2) return "stable";

    const midPoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midPoint);
    const secondHalf = entries.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 0.3) return "improving";
    if (difference < -0.3) return "declining";
    return "stable";
  }
}

export default MoodUtils;