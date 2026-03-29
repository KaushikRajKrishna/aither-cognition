#!/usr/bin/env node

/**
 * Mood Tracking Service Test Script
 * Tests basic functionality of the enhanced mood tracking system
 */

import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import MoodService from "./server/services/moodService.js";
import MoodUtils from "./server/services/moodUtils.js";

// Mock user ID for testing
const TEST_USER_ID = new mongoose.Types.ObjectId();

async function testMoodService() {
  console.log("🧪 Testing Mood Tracking Service...\n");

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aither-cognition");
    console.log("✅ Connected to database");

    // Test 1: Add mood entry
    console.log("\n📝 Test 1: Adding mood entry...");
    const moodEntry = await MoodService.addMoodEntry(TEST_USER_ID, "happy", "Feeling great today!");
    console.log("✅ Mood entry added:", {
      id: moodEntry.moodId,
      mood: moodEntry.mood,
      score: moodEntry.moodScore,
      detected: moodEntry.detectedMood,
      sentiment: moodEntry.sentimentScore?.toFixed(2)
    });

    // Test 2: Add another mood entry
    console.log("\n📝 Test 2: Adding stressed mood entry...");
    const stressedEntry = await MoodService.addMoodEntry(TEST_USER_ID, "stressed", "Work is overwhelming");
    console.log("✅ Stressed mood entry added:", {
      id: stressedEntry.moodId,
      mood: stressedEntry.mood,
      score: stressedEntry.moodScore
    });

    // Test 3: Get mood history
    console.log("\n📚 Test 3: Getting mood history...");
    const history = await MoodService.getMoodHistory(TEST_USER_ID, 10, 0);
    console.log(`✅ Retrieved ${history.entries.length} mood entries`);

    // Test 4: Analyze mood
    console.log("\n📊 Test 4: Analyzing mood patterns...");
    const analysis = await MoodService.analyzeMood(TEST_USER_ID, 30);
    console.log("✅ Mood analysis:", {
      average: analysis.averageMoodScore.toFixed(2),
      dominant: analysis.dominantMood,
      trend: analysis.trend,
      stressFreq: `${analysis.stressFrequency}%`
    });

    // Test 5: Generate weekly report
    console.log("\n📋 Test 5: Generating weekly report...");
    const report = await MoodService.getWeeklyReport(TEST_USER_ID, 0);
    console.log("✅ Weekly report:", {
      week: report.weekNumber,
      entries: report.totalEntries,
      average: report.averageMoodScore.toFixed(2),
      trend: report.weekTrend,
      recommendations: report.recommendations.length
    });

    // Test 6: Check alerts
    console.log("\n🚨 Test 6: Checking alerts...");
    const alerts = await MoodService.getActiveAlerts(TEST_USER_ID);
    console.log(`✅ Found ${alerts.length} active alerts`);

    // Test 7: Generate sample data
    console.log("\n🎲 Test 7: Generating sample data...");
    const sampleResult = await MoodUtils.generateSampleData(TEST_USER_ID, 20);
    console.log(`✅ Generated ${sampleResult.count} sample entries`);

    // Test 8: Get insights
    console.log("\n🧠 Test 8: Getting AI insights...");
    const insights = await MoodUtils.getUserInsights(TEST_USER_ID, 30);
    console.log("✅ AI Insights:", {
      insightsCount: insights.insights.length,
      recommendationsCount: insights.recommendations.length,
      dataPoints: insights.dataPoints
    });

    // Test 9: Database stats
    console.log("\n📈 Test 9: Getting database stats...");
    const stats = await MoodUtils.getDatabaseStats();
    console.log("✅ Database stats:", {
      moods: stats.collections.moods,
      alerts: stats.collections.alerts,
      events: stats.collections.events
    });

    console.log("\n🎉 All tests passed! Mood Tracking Service is working correctly.\n");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    // Cleanup: Remove test data
    try {
      console.log("🧹 Cleaning up test data...");
      await mongoose.connection.db.collection('moodentries').deleteMany({ userId: TEST_USER_ID });
      await mongoose.connection.db.collection('alerts').deleteMany({ userId: TEST_USER_ID });
      await mongoose.connection.db.collection('events').deleteMany({ userId: TEST_USER_ID });
      console.log("✅ Test data cleaned up");
    } catch (cleanupError) {
      console.warn("⚠️  Cleanup warning:", cleanupError.message);
    }

    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMoodService();
}

export { testMoodService };