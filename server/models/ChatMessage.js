import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    // Relationship to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Message content
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    // Emotional analysis (for user messages)
    emotion: {
      primary: {
        type: String,
        enum: [
          "joy",
          "sadness",
          "anxiety",
          "anger",
          "fear",
          "disgust",
          "surprise",
          "neutral",
        ],
      },
      secondary: [String], // Multiple possible emotions
      confidence: Number, // 0-1
      sentimentScore: Number, // -1 to 1
    },

    // Crisis/Safety detection
    safety: {
      riskLevel: {
        type: String,
        enum: ["none", "low", "medium", "high", "critical"],
        default: "none",
      },
      flags: [String], // List of detected crisis indicators
      overridden: Boolean, // Whether response was overridden for safety
      overrideReason: String, // Why it was overridden
    },

    // Context and metadata
    contextUsed: [String], // Knowledge base topics used
    model: String, // Which AI model generated the response
    tokensUsed: {
      input: Number,
      output: Number,
    },

    // Session tracking
    sessionId: String,
    conversationIndex: Number, // Position in conversation

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ userId: 1, sessionId: 1, conversationIndex: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
