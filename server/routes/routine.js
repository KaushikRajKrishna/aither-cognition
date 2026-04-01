import express from "express";
import { listRoutines, addRoutine, toggleRoutine, deleteRoutine } from "../controllers/routineController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, listRoutines);
router.post("/", protect, addRoutine);
router.patch("/:taskId/toggle", protect, toggleRoutine);
router.delete("/:taskId", protect, deleteRoutine);

export default router;
