import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema(
  {
    moodId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mood: {
      type: String,
      enum: ["happy", "calm", "neutral", "stressed", "sad"],
      required: true,
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    note: {
      type: String,
      maxlength: 500,
      default: "",
    },
    detectedMood: {
      type: String,
      enum: ["happy", "calm", "neutral", "stressed", "sad"],
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
  },
  { timestamps: true }
);

// Indexes for performance
moodEntrySchema.index({ userId: 1, createdAt: -1 });
moodEntrySchema.index({ userId: 1 });
moodEntrySchema.index({ createdAt: -1 });

export default mongoose.model("MoodEntry", moodEntrySchema);