import express from "express";
import {
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updateAvailability,
  updateLeaves,
} from "../controllers/doctorController.js";
import { protectDoctor } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerDoctor);
// named PUT routes MUST come before /:id wildcard
router.put("/availability", protectDoctor, updateAvailability);
router.put("/leaves", protectDoctor, updateLeaves);
router.get("/:id", getDoctorById);

export default router;
