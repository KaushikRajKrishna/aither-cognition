import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alertType: {
      type: String,
      enum: ["HIGH_STRESS_ALERT", "LOW_MOOD_ALERT"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for performance
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, resolved: 1 });
alertSchema.index({ alertId: 1 });

export default mongoose.model("Alert", alertSchema);