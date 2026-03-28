import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    // The specific calendar date of the appointment
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    // Day-of-week derived from date at booking time (for quick availability checks)
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index: efficiently count appointments per doctor per date
appointmentSchema.index({ doctorId: 1, date: 1 });
// Efficiently list a user's appointments
appointmentSchema.index({ userId: 1, date: 1 });

export default mongoose.model("Appointment", appointmentSchema);
