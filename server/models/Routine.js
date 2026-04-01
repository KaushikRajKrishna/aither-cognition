import mongoose from "mongoose";

const routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["work", "medication", "exercise", "sleep", "custom"],
      required: true,
    },
    time: {
      type: String, // HH:mm
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastNotifiedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique per user+taskId
routineSchema.index({ userId: 1, taskId: 1 }, { unique: true });

export default mongoose.model("Routine", routineSchema);
