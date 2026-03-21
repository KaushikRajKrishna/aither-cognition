import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import moodRoutes from "./routes/mood.js";

const app = express();

// Middleware
app.use(cors({ origin: ["http://localhost:8080", "http://localhost:8081"], credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
