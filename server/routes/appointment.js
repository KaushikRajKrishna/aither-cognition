import express from "express";
import {
  bookAppointment,
  getUserAppointments,
  getDoctorAppointments,
  cancelAppointment,
  confirmAppointment,
  assignNextVisit,
  checkAvailability,
} from "../controllers/appointmentController.js";
import { protect, protectDoctor } from "../middleware/auth.js";

const router = express.Router();

// Public availability check (used during booking UI before login prompt)
router.get("/availability/:doctorId/:date", checkAvailability);

// User routes
router.post("/", protect, bookAppointment);
router.get("/mine", protect, getUserAppointments);

// Doctor routes
router.get("/doctor", protectDoctor, getDoctorAppointments);

// Doctor assigns a next visit (auto-confirmed)
router.post("/assign", protectDoctor, assignNextVisit);

// Confirm — doctor only
router.patch("/:id/confirm", protectDoctor, confirmAppointment);

// Cancel — available to both user and doctor (protect handles both roles)
router.delete("/:id", protect, cancelAppointment);

export default router;
