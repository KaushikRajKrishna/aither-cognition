import Routine from "../models/Routine.js";

// GET /api/routine — list all routines for the current user
export const listRoutines = async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.user._id }).sort({ time: 1 });
    res.json({ routines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/routine — add a new routine task
export const addRoutine = async (req, res) => {
  try {
    const { taskId, title, type, time } = req.body;
    if (!taskId || !title || !type || !time) {
      return res.status(400).json({ message: "taskId, title, type and time are required" });
    }

    const routine = await Routine.create({
      userId: req.user._id,
      taskId,
      title: title.trim(),
      type,
      time,
      enabled: true,
    });

    res.status(201).json({ routine });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Task already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/routine/:taskId/toggle — toggle enabled/disabled
export const toggleRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOne({ userId: req.user._id, taskId: req.params.taskId });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    routine.enabled = !routine.enabled;
    await routine.save();

    res.json({ routine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/routine/:taskId — remove a routine task
export const deleteRoutine = async (req, res) => {
  try {
    const result = await Routine.deleteOne({ userId: req.user._id, taskId: req.params.taskId });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Routine not found" });
    res.json({ message: "Routine removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
