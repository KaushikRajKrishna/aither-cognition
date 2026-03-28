import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// POST /api/appointment  — user books an appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date: dateStr, notes } = req.body;

    if (!doctorId || !dateStr) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    // Normalize to midnight UTC so date comparisons work cleanly
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = DAYS[dayStart.getUTCDay()];

    // Fetch doctor with availability + leaves
    const doctor = await Doctor.findById(doctorId).select("availability leaves name");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check if date is in leaves
    const isOnLeave = doctor.leaves?.some((leave) => {
      const l = new Date(leave);
      return l.getUTCFullYear() === dayStart.getUTCFullYear() &&
             l.getUTCMonth()    === dayStart.getUTCMonth()    &&
             l.getUTCDate()     === dayStart.getUTCDate();
    });
    if (isOnLeave) {
      return res.status(400).json({ message: `Dr. ${doctor.name} is on leave on this date` });
    }

    // If doctor has no availability set → open schedule, any day is allowed
    const hasAvailability = doctor.availability?.length > 0;
    const slot = hasAvailability
      ? doctor.availability.find((a) => a.day === dayOfWeek)
      : null;

    if (hasAvailability && !slot) {
      return res.status(400).json({
        message: `Dr. ${doctor.name} is not available on ${dayOfWeek}s`,
      });
    }

    // Check if the user already has a booking with this doctor on this date
    const duplicate = await Appointment.findOne({
      userId: req.user._id,
      doctorId,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: "cancelled" },
    });
    if (duplicate) {
      return res.status(409).json({ message: "You already have an appointment on this date" });
    }

    // Enforce per-day limit only when availability is configured
    if (slot) {
      const booked = await Appointment.countDocuments({
        doctorId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "cancelled" },
      });
      if (booked >= slot.limit) {
        return res.status(400).json({
          message: `No slots available for ${dayOfWeek} — daily limit of ${slot.limit} reached`,
        });
      }
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date: dayStart,
      dayOfWeek,
      notes: notes?.trim() || "",
    });

    const populated = await appointment.populate([
      { path: "doctorId", select: "name hospitalName expertise consultationMode" },
      { path: "userId", select: "name email" },
    ]);

    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointment/mine — logged-in user's appointments
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .sort({ date: 1 })
      .populate("doctorId", "name hospitalName expertise consultationMode");
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointment/doctor — logged-in doctor's appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user._id })
      .sort({ date: 1 })
      .populate("userId", "name email gender");
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/appointment/assign — doctor schedules a confirmed next-visit for a patient
export const assignNextVisit = async (req, res) => {
  try {
    const { userId, date: dateStr, notes } = req.body;
    const doctorId = req.user._id;

    if (!userId || !dateStr) {
      return res.status(400).json({ message: "userId and date are required" });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const dayStart  = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayEnd    = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = DAYS[dayStart.getUTCDay()];

    const doctor = await Doctor.findById(doctorId).select("availability leaves name");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Leaves check
    const isOnLeave = doctor.leaves?.some((leave) => {
      const l = new Date(leave);
      const ls = new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()));
      return ls.getTime() === dayStart.getTime();
    });
    if (isOnLeave) {
      return res.status(400).json({ message: `You are on leave on ${dayOfWeek}, ${dayStart.toDateString()}` });
    }

    // Availability + limit check (same rules as patient booking)
    const hasAvailability = doctor.availability?.length > 0;
    const slot = hasAvailability ? doctor.availability.find((a) => a.day === dayOfWeek) : null;

    if (hasAvailability && !slot) {
      return res.status(400).json({ message: `You are not available on ${dayOfWeek}s` });
    }

    // Duplicate check — patient must not already have an active booking on this date
    const duplicate = await Appointment.findOne({
      userId,
      doctorId,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: "cancelled" },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Patient already has an appointment on this date" });
    }

    // Per-day limit check
    if (slot) {
      const booked = await Appointment.countDocuments({
        doctorId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "cancelled" },
      });
      if (booked >= slot.limit) {
        return res.status(400).json({
          message: `Daily limit of ${slot.limit} reached for ${dayOfWeek}`,
        });
      }
    }

    // Create as confirmed directly — no need for doctor to confirm again
    const appointment = await Appointment.create({
      userId,
      doctorId,
      date: dayStart,
      dayOfWeek,
      notes: notes?.trim() || "",
      status: "confirmed",
    });

    const populated = await appointment.populate([
      { path: "doctorId", select: "name hospitalName expertise consultationMode" },
      { path: "userId",   select: "name email gender" },
    ]);

    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointment/:id/confirm — doctor confirms a pending appointment
export const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the assigned doctor can confirm this appointment" });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({ message: `Cannot confirm an appointment with status: ${appointment.status}` });
    }

    appointment.status = "confirmed";
    await appointment.save();
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/appointment/:id — cancel appointment (user or doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isOwner =
      appointment.userId.toString() === req.user._id.toString() ||
      appointment.doctorId.toString() === req.user._id.toString();

    if (!isOwner) return res.status(403).json({ message: "Not authorized" });

    appointment.status = "cancelled";
    await appointment.save();
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointment/availability/:doctorId/:date — slots left on a given date
export const checkAvailability = async (req, res) => {
  try {
    const { doctorId, date: dateStr } = req.params;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayOfWeek = DAYS[dayStart.getUTCDay()];

    const doctor = await Doctor.findById(doctorId).select("availability leaves");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check leaves first
    const isOnLeave = doctor.leaves?.some((leave) => {
      const l = new Date(leave);
      return l.getUTCFullYear() === dayStart.getUTCFullYear() &&
             l.getUTCMonth()    === dayStart.getUTCMonth()    &&
             l.getUTCDate()     === dayStart.getUTCDate();
    });
    if (isOnLeave) {
      return res.json({ available: false, slotsLeft: 0, limit: 0, dayOfWeek, onLeave: true });
    }

    const hasAvailability = doctor.availability?.length > 0;
    const slot = doctor.availability.find((a) => a.day === dayOfWeek);

    // No availability configured → open schedule, always bookable
    if (!hasAvailability) {
      return res.json({ available: true, slotsLeft: null, limit: null, dayOfWeek, openSchedule: true });
    }

    // Availability configured but this day not included
    if (!slot) return res.json({ available: false, slotsLeft: 0, limit: 0, dayOfWeek });

    const booked = await Appointment.countDocuments({
      doctorId,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $ne: "cancelled" },
    });

    res.json({
      available: booked < slot.limit,
      slotsLeft: Math.max(0, slot.limit - booked),
      limit: slot.limit,
      dayOfWeek,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
