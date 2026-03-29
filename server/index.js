import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/mood.js";
import moodAdminRoutes from "./routes/moodAdmin.js";
import chatRoutes from "./routes/chat.js";
import doctorRoutes from "./routes/doctor.js";
import appointmentRoutes from "./routes/appointment.js";
import { getAllDoctors } from "./controllers/doctorController.js";

const app = express();

// Middleware
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:8081"], credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/mood-admin", moodAdminRoutes);
app.use("/api/chat", chatRoutes);
// GET /api/doctor registered directly — Express 5 subrouters don't match empty
// suffix paths reliably, so the list route lives here instead of the subrouter
app.get("/api/doctor", getAllDoctors);
app.use("/api/doctor", doctorRoutes);
app.use("/api/appointment", appointmentRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
