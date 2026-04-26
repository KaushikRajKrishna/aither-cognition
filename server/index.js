import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/mood.js";
import moodAdminRoutes from "./routes/moodAdmin.js";
import chatRoutes from "./routes/chat.js";
import chatHistoryRoutes from "./routes/chatHistory.js";
import doctorRoutes from "./routes/doctor.js";
import appointmentRoutes from "./routes/appointment.js";
import notificationRoutes from "./routes/notification.js";
import routineRoutes from "./routes/routine.js";
import { getAllDoctors } from "./controllers/doctorController.js";
import Appointment from "./models/Appointment.js";
import Alert from "./models/Alert.js";
import Routine from "./models/Routine.js";
import NotificationService from "./services/notificationService.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173", // Vite default dev port
  "https://aither-cognition.vercel.app", // Vercel production frontend
];

// Add production URLs from environment variable if present
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
}

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/mood-admin", moodAdminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat-history", chatHistoryRoutes);
// GET /api/doctor registered directly — Express 5 subrouters don't match empty
// suffix paths reliably, so the list route lives here instead of the subrouter
app.get("/api/doctor", getAllDoctors);
app.use("/api/doctor", doctorRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/routine", routineRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

  // Every 30 minutes — re-notify users with active (unresolved) mood alerts
  cron.schedule("*/30 * * * *", async () => {
    try {
      const activeAlerts = await Alert.find({ resolved: false });
      for (const alert of activeAlerts) {
        await NotificationService.sendMoodAlert(alert.userId, alert.alertType, alert.message);
      }
      if (activeAlerts.length) {
        console.log(`[cron] Re-notified ${activeAlerts.length} active mood alert(s)`);
      }
    } catch (err) {
      console.error("[cron] Active alert re-notify error:", err.message);
    }
  });

  // Every minute — send push + email for due routine tasks
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const HHmm = now.toTimeString().slice(0, 5);
      const todayStr = now.toDateString();

      const dueRoutines = await Routine.find({ enabled: true, time: HHmm });
      for (const routine of dueRoutines) {
        const notifiedToday =
          routine.lastNotifiedDate &&
          new Date(routine.lastNotifiedDate).toDateString() === todayStr;
        if (notifiedToday) continue;

        await NotificationService.sendRoutineReminder(routine.userId, routine.title, routine.type);
        routine.lastNotifiedDate = now;
        await routine.save();
      }
    } catch (err) {
      console.error("[cron] Routine reminder error:", err.message);
    }
  });

  // Daily cron job at 8:00 AM — send appointment reminders for today's appointments
  cron.schedule("0 8 * * *", async () => {
    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const appointments = await Appointment.find({
        date: { $gte: todayStart, $lt: todayEnd },
        status: { $ne: "cancelled" },
      }).populate("doctorId", "name");

      for (const appt of appointments) {
        const doctorName = appt.doctorId?.name || "your doctor";
        await NotificationService.sendAppointmentReminder(appt.userId, doctorName, appt.date);
      }
      console.log(`[cron] Sent ${appointments.length} appointment reminder(s)`);
    } catch (err) {
      console.error("[cron] Appointment reminder error:", err.message);
    }
  });
})();
