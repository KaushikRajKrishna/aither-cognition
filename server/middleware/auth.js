import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

// Attach req.user for any authenticated account (user or doctor)
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "doctor") {
      req.user = await Doctor.findById(decoded.id).select("-password");
    } else {
      req.user = await User.findById(decoded.id).select("-password");
    }

    if (!req.user) return res.status(401).json({ message: "Account not found" });
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Only allow doctors through
export const protectDoctor = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access required" });
    }
    req.user = await Doctor.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "Doctor not found" });
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};
