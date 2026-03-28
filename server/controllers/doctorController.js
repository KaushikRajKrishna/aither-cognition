import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

const signToken = (id) =>
  jwt.sign({ id, role: "doctor" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const safeDoctor = (doc) => ({
  id: doc._id,
  name: doc.name,
  email: doc.email,
  role: doc.role,
  expertise: doc.expertise,
  hospitalName: doc.hospitalName,
});

// POST /api/doctor/register
export const registerDoctor = async (req, res) => {
  try {
    const {
      name, email, password, phone, gender,
      qualification, experience, licenseNumber, hospitalName,
      consultationMode, expertise, commonAreas,
    } = req.body;

    const missing = [];
    if (!name)          missing.push("name");
    if (!email)         missing.push("email");
    if (!password)      missing.push("password");
    if (!phone)         missing.push("phone");
    if (!gender)        missing.push("gender");
    if (!qualification) missing.push("qualification");
    if (experience === undefined || experience === "") missing.push("experience");
    if (!licenseNumber) missing.push("licenseNumber");
    if (!hospitalName)  missing.push("hospitalName");

    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
    if (!expertise?.length) {
      return res.status(400).json({ message: "Select at least one area of expertise" });
    }
    if (!commonAreas?.length) {
      return res.status(400).json({ message: "Select at least one common area treated" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await Doctor.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const doctor = await Doctor.create({
      name, email, password, phone, gender,
      qualification, experience: Number(experience),
      licenseNumber, hospitalName,
      consultationMode: consultationMode || [],
      expertise, commonAreas,
    });

    const token = signToken(doctor._id);
    res.status(201).json({ token, doctor: safeDoctor(doctor) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctor — public list (fields needed for booking UI)
export const getAllDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find({}).select(
      "name email gender qualification experience hospitalName consultationMode expertise commonAreas availability leaves"
    );
    res.json({ doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctor/:id — public single doctor
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/doctor/availability — doctor sets their available days + limits
// Body: { availability: [{ day: "Monday", limit: 8 }, ...] }
export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: "availability must be an array" });
    }

    const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const entry of availability) {
      if (!VALID_DAYS.includes(entry.day)) {
        return res.status(400).json({ message: `Invalid day: ${entry.day}` });
      }
      if (!entry.limit || entry.limit < 1) {
        return res.status(400).json({ message: `Limit must be at least 1 for day ${entry.day}` });
      }
    }

    // Remove duplicate days — keep last occurrence
    const seen = new Set();
    const deduped = availability.filter((e) => {
      if (seen.has(e.day)) return false;
      seen.add(e.day);
      return true;
    });

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      { $set: { availability: deduped } },
      { new: true }
    ).select("-password");

    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/doctor/leaves — doctor sets specific leave dates
// Body: { leaves: ["2024-12-25", "2024-12-26", ...] }
export const updateLeaves = async (req, res) => {
  try {
    const { leaves } = req.body;
    if (!Array.isArray(leaves)) {
      return res.status(400).json({ message: "leaves must be an array of date strings" });
    }

    // Normalise each entry to UTC midnight
    const parsed = leaves.map((d) => {
      const date = new Date(d);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${d}`);
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    });

    // Deduplicate
    const unique = [...new Map(parsed.map((d) => [d.toISOString(), d])).values()];

    const doctor = await Doctor.findByIdAndUpdate(
      req.user._id,
      { $set: { leaves: unique } },
      { new: true }
    ).select("-password");

    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
