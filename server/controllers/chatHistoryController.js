import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

/**
 * Get chat history for a user
 */
export const getUserChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId, limit = 50, offset = 0 } = req.query;

    // Verify user has permission to view this history
    if (req.user?.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = { userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await ChatMessage.countDocuments(query);

    res.json({
      messages,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[getUserChatHistory] error:", err.message);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

/**
 * Get flagged high-risk messages for admin review
 */
export const getFlaggedMessages = async (req, res) => {
  try {
    // Only admins can view flagged messages
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { riskLevel = "high", limit = 50, offset = 0, resolved = false } =
      req.query;

    const query = {
      "safety.riskLevel": { $in: [riskLevel, "critical"] },
    };

    if (resolved === "true" || resolved === "false") {
      query["safety.reviewed"] = resolved === "true";
    }

    const messages = await ChatMessage.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await ChatMessage.countDocuments(query);

    res.json({
      flaggedMessages: messages,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[getFlaggedMessages] error:", err.message);
    res.status(500).json({ message: "Failed to fetch flagged messages" });
  }
};

/**
 * Get conversation transcript between two messages
 */
export const getConversationTranscript = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    // Verify permission
    if (req.user?.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const messages = await ChatMessage.find({
      sessionId,
      userId,
    }).sort({ conversationIndex: 1 });

    // Calculate summary
    const summary = {
      sessionId,
      startedAt: messages[0]?.createdAt,
      endedAt: messages[messages.length - 1]?.createdAt,
      messageCount: messages.length,
      emotions: messages
        .filter((m) => m.emotion?.primary)
        .map((m) => m.emotion.primary),
      riskLevels: messages
        .filter((m) => m.safety?.riskLevel)
        .map((m) => m.safety.riskLevel),
      highestRisk:
        messages
          .filter((m) => m.safety?.riskLevel)
          .sort((a, b) => {
            const order = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
            return order[b.safety.riskLevel] - order[a.safety.riskLevel];
          })[0]?.safety.riskLevel || "none",
    };

    res.json({
      transcript: messages,
      summary,
    });
  } catch (err) {
    console.error("[getConversationTranscript] error:", err.message);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

/**
 * Mark flagged message as reviewed
 */
export const markAsReviewed = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { messageId } = req.params;
    const { action, notes } = req.body;

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        "safety.reviewed": true,
        "safety.reviewedAt": new Date(),
        "safety.reviewedBy": req.user.id,
        "safety.reviewAction": action, // 'acknowledged', 'escalated', 'false_alarm'
        "safety.reviewNotes": notes,
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // If escalated, could trigger email to crisis team
    if (action === "escalated") {
      // TODO: Send alert to crisis response team
      console.log(
        `[markAsReviewed] ESCALATED message ${messageId} for user ${message.userId}`
      );
    }

    res.json({
      message: "Message marked as reviewed",
      data: message,
    });
  } catch (err) {
    console.error("[markAsReviewed] error:", err.message);
    res.status(500).json({ message: "Failed to update message" });
  }
};

/**
 * Get conversation statistics for a user
 */
export const getConversationStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify permission
    if (req.user?.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const stats = await ChatMessage.aggregate([
      { $match: { userId: require("mongoose").Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: {
            $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
          },
          assistantMessages: {
            $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] },
          },
          uniqueSessions: { $addToSet: "$sessionId" },
          averageEmotionScore: {
            $avg: "$emotion.sentimentScore",
          },
          highestRiskCount: {
            $sum: {
              $cond: [{ $eq: ["$safety.riskLevel", "critical"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          totalMessages: 1,
          userMessages: 1,
          assistantMessages: 1,
          uniqueSessions: { $size: "$uniqueSessions" },
          averageEmotionScore: { $round: ["$averageEmotionScore", 2] },
          highestRiskCount: 1,
        },
      },
    ]);

    res.json({
      stats: stats[0] || {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        uniqueSessions: 0,
        averageEmotionScore: 0,
        highestRiskCount: 0,
      },
    });
  } catch (err) {
    console.error("[getConversationStats] error:", err.message);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

/**
 * Export conversation as JSON
 */
export const exportConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    // Verify permission
    if (req.user?.id !== userId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const messages = await ChatMessage.find({
      sessionId,
      userId,
    }).sort({ conversationIndex: 1 });

    // Create export object
    const exportData = {
      exportedAt: new Date(),
      sessionId,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        emotion: m.emotion,
        safety: m.safety,
        timestamp: m.createdAt,
      })),
    };

    // Send as downloadable JSON
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conversation-${sessionId}.json"`
    );
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error("[exportConversation] error:", err.message);
    res.status(500).json({ message: "Failed to export conversation" });
  }
};
