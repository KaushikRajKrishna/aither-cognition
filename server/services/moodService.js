import { v4 as uuidv4 } from "uuid";
import Sentiment from "sentiment";
import MoodEntry from "../models/MoodEntry.js";
import Alert from "../models/Alert.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

const sentiment = new Sentiment();

class MoodService {
  // Mood score mapping (1-5 scale)
  static MOOD_SCORES = {
    happy: 5,
    calm: 4,
    neutral: 3,
    stressed: 2,
    sad: 1,
  };

  // Sentiment analysis
  static analyzeSentiment(text) {
    if (!text || text.trim() === "") {
      return { score: 0, comparative: 0 };
    }
    return sentiment.analyze(text);
  }

  // Detect mood from sentiment score
  static detectMoodFromSentiment(score) {
    if (score >= 0.3) return "happy";
    if (score >= 0.1) return "calm";
    if (score >= -0.1) return "neutral";
    if (score >= -0.3) return "stressed";
    return "sad";
  }

  // Add mood entry with analysis
  static async addMoodEntry(userId, mood, note = "") {
    try {
      // Validate mood
      if (!["happy", "calm", "neutral", "stressed", "sad"].includes(mood)) {
        throw new Error("Invalid mood type");
      }

      // Perform sentiment analysis if note provided
      let detectedMood = null;
      let sentimentScore = null;

      if (note && note.trim()) {
        const sentimentResult = this.analyzeSentiment(note);
        sentimentScore = sentimentResult.comparative;
        detectedMood = this.detectMoodFromSentiment(sentimentScore);
      }

      // Get mood score
      const moodScore = this.MOOD_SCORES[mood];

      // Create mood entry
      const moodEntry = new MoodEntry({
        moodId: uuidv4(),
        userId,
        mood,
        moodScore,
        note,
        detectedMood,
        sentimentScore,
      });

      await moodEntry.save();

      // Update user mood count
      await User.findByIdAndUpdate(userId, {
        $inc: { totalMoodEntries: 1 },
        $set: { lastMoodEntry: new Date() },
      });

      // Publish mood logged event
      await this.publishEvent("MOOD_LOGGED", userId, {
        moodId: moodEntry.moodId,
        mood,
        moodScore,
        detectedMood,
        sentimentScore,
      });

      // Check for alerts
      await this.checkForAlerts(userId);

      return moodEntry;
    } catch (error) {
      throw new Error(`Failed to add mood entry: ${error.message}`);
    }
  }

  // Get mood history with pagination
  static async getMoodHistory(userId, limit = 30, offset = 0) {
    try {
      const entries = await MoodEntry.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select("-__v");

      const totalEntries = await MoodEntry.countDocuments({ userId });

      return {
        entries,
        totalEntries,
        limit,
        offset,
      };
    } catch (error) {
      throw new Error(`Failed to get mood history: ${error.message}`);
    }
  }

  // Analyze mood patterns
  static async analyzeMood(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await MoodEntry.find({
        userId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 });

      if (entries.length === 0) {
        return {
          averageMoodScore: 0,
          dominantMood: null,
          moodDistribution: {},
          stressFrequency: 0,
          trend: "stable",
          alerts: [],
          analysisDays: days,
          analyzedAt: new Date(),
        };
      }

      // Calculate average mood score
      const totalScore = entries.reduce((sum, entry) => sum + entry.moodScore, 0);
      const averageMoodScore = totalScore / entries.length;

      // Calculate mood distribution
      const moodDistribution = {};
      entries.forEach((entry) => {
        moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      });

      // Find dominant mood
      const dominantMood = Object.keys(moodDistribution).reduce((a, b) =>
        moodDistribution[a] > moodDistribution[b] ? a : b
      );

      // Calculate stress frequency (stressed + sad entries)
      const stressEntries = entries.filter((entry) =>
        ["stressed", "sad"].includes(entry.mood)
      ).length;
      const stressFrequency = (stressEntries / entries.length) * 100;

      // Calculate trend
      const trend = this.calculateTrend(entries);

      // Get active alerts
      const alerts = await Alert.find({
        userId,
        resolved: false,
      }).select("-__v");

      return {
        averageMoodScore: Math.round(averageMoodScore * 100) / 100,
        dominantMood,
        moodDistribution,
        stressFrequency: Math.round(stressFrequency * 100) / 100,
        trend,
        alerts,
        analysisDays: days,
        analyzedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to analyze mood: ${error.message}`);
    }
  }

  // Generate weekly report
  static async getWeeklyReport(userId, weekOffset = 0) {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * weekOffset));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const entries = await MoodEntry.find({
        userId,
        createdAt: { $gte: weekStart, $lte: weekEnd },
      }).sort({ createdAt: 1 });

      const weekNumber = Math.ceil((weekStart.getDate() - 1) / 7) + 1;
      const totalEntries = entries.length;

      if (totalEntries === 0) {
        return {
          userId,
          weekStart,
          weekEnd,
          weekNumber,
          totalEntries: 0,
          averageMoodScore: 0,
          dominantMood: null,
          stressDays: 0,
          weekTrend: "stable",
          recommendations: ["Start logging your moods to track your emotional patterns."],
          moodEntries: [],
          generatedAt: new Date(),
        };
      }

      // Calculate metrics
      const totalScore = entries.reduce((sum, entry) => sum + entry.moodScore, 0);
      const averageMoodScore = totalScore / totalEntries;

      const moodDistribution = {};
      entries.forEach((entry) => {
        moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      });

      const dominantMood = Object.keys(moodDistribution).reduce((a, b) =>
        moodDistribution[a] > moodDistribution[b] ? a : b
      );

      // Count stress days (days with stressed or sad moods)
      const stressDays = new Set();
      entries.forEach((entry) => {
        if (["stressed", "sad"].includes(entry.mood)) {
          const day = entry.createdAt.toDateString();
          stressDays.add(day);
        }
      });

      // Calculate week trend
      const weekTrend = this.calculateWeekTrend(entries);

      // Generate recommendations
      const recommendations = this.generateRecommendations(averageMoodScore, stressDays.size, dominantMood);

      return {
        userId,
        weekStart,
        weekEnd,
        weekNumber,
        totalEntries,
        averageMoodScore: Math.round(averageMoodScore * 100) / 100,
        dominantMood,
        stressDays: stressDays.size,
        weekTrend,
        recommendations,
        moodEntries: entries,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate weekly report: ${error.message}`);
    }
  }

  // Calculate trend from mood entries
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

  // Calculate week trend
  static calculateWeekTrend(entries) {
    if (entries.length < 2) return "stable";

    const midPoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midPoint);
    const secondHalf = entries.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.moodScore, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 0.2) return "improving";
    if (difference < -0.2) return "declining";
    return "stable";
  }

  // Generate recommendations based on mood data
  static generateRecommendations(averageScore, stressDays, dominantMood) {
    const recommendations = [];

    if (averageScore <= 2) {
      recommendations.push("Consider speaking with a mental health professional for additional support.");
      recommendations.push("Practice mindfulness or meditation daily.");
    }

    if (stressDays >= 3) {
      recommendations.push("Try relaxation techniques like deep breathing or progressive muscle relaxation.");
      recommendations.push("Consider reducing stressors in your daily routine.");
    }

    if (dominantMood === "sad") {
      recommendations.push("Connect with friends or loved ones for social support.");
      recommendations.push("Engage in activities you once enjoyed.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Keep up the good work tracking your mood!");
      recommendations.push("Consider adding more detailed notes to better understand your emotional patterns.");
    }

    return recommendations;
  }

  // Check for alerts
  static async checkForAlerts(userId) {
    try {
      // Check for consecutive low mood (score ≤ 2)
      const lowMoodDays = await this.getConsecutiveLowMoodDays(userId, 2, 3);
      if (lowMoodDays >= 3) {
        await this.createAlert(userId, "LOW_MOOD_ALERT", `Detected ${lowMoodDays} consecutive days of low mood`);
        await this.publishEvent("LOW_MOOD_ALERT", userId, { consecutiveDays: lowMoodDays, threshold: 2 });
      }

      // Check for high stress (stressed/sad for 3+ consecutive days)
      const stressDays = await this.getConsecutiveStressDays(userId, 3);
      if (stressDays >= 3) {
        await this.createAlert(userId, "HIGH_STRESS_ALERT", `Detected ${stressDays} consecutive days of high stress`);
        await this.publishEvent("HIGH_STRESS_ALERT", userId, { consecutiveDays: stressDays });
      }
    } catch (error) {
      console.error("Error checking for alerts:", error);
    }
  }

  // Get consecutive low mood days
  static async getConsecutiveLowMoodDays(userId, threshold = 2, daysToCheck = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToCheck);

      const entries = await MoodEntry.find({
        userId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: -1 });

      let consecutiveDays = 0;
      for (const entry of entries) {
        if (entry.moodScore <= threshold) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      return consecutiveDays;
    } catch (error) {
      console.error("Error getting consecutive low mood days:", error);
      return 0;
    }
  }

  // Get consecutive stress days
  static async getConsecutiveStressDays(userId, daysToCheck = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToCheck);

      const entries = await MoodEntry.find({
        userId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: -1 });

      let consecutiveDays = 0;
      for (const entry of entries) {
        if (["stressed", "sad"].includes(entry.mood)) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      return consecutiveDays;
    } catch (error) {
      console.error("Error getting consecutive stress days:", error);
      return 0;
    }
  }

  // Create alert
  static async createAlert(userId, alertType, message) {
    try {
      // Check if similar unresolved alert exists
      const existingAlert = await Alert.findOne({
        userId,
        alertType,
        resolved: false,
      });

      if (existingAlert) {
        return existingAlert; // Don't create duplicate alerts
      }

      const alert = new Alert({
        alertId: uuidv4(),
        userId,
        alertType,
        message,
      });

      await alert.save();
      return alert;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  }

  // Publish event
  static async publishEvent(eventType, userId, data = {}) {
    try {
      const event = new Event({
        eventId: uuidv4(),
        eventType,
        userId,
        data,
      });

      await event.save();
      return event;
    } catch (error) {
      console.error("Error publishing event:", error);
      throw error;
    }
  }

  // Get active alerts
  static async getActiveAlerts(userId) {
    try {
      return await Alert.find({
        userId,
        resolved: false,
      }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }

  // Resolve alert
  static async resolveAlert(userId, alertId) {
    try {
      const alert = await Alert.findOneAndUpdate(
        { alertId, userId },
        {
          resolved: true,
          resolvedAt: new Date(),
        },
        { new: true }
      );

      if (alert) {
        await this.publishEvent("ALERT_RESOLVED", userId, {
          alertId,
          alertType: alert.alertType,
        });
      }

      return alert;
    } catch (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }
}

export default MoodService;