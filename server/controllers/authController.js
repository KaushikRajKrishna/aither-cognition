import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

const signToken = (id, role = "user") =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

const safeUser = (account) => ({
  id: account._id,
  name: account.name,
  email: account.email,
  role: account.role,
  gender: account.gender,
  dateOfBirth: account.dateOfBirth,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, gender, whyHere, feelingToday } = req.body;

    if (!name || !email || !password || !dateOfBirth || !gender) {
      return res.status(400).json({
        message: "Name, email, password, date of birth, and gender are required",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = await User.create({
      name, email, password, dateOfBirth, gender,
      whyHere: whyHere || "",
      feelingToday: feelingToday || "",
    });

    const token = signToken(user._id, user.role);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login  — checks User collection first, then Doctor
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Try User first
    let account = await User.findOne({ email });
    if (account) {
      if (!(await account.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = signToken(account._id, account.role);
      return res.json({ token, user: safeUser(account) });
    }

    // Try Doctor
    account = await Doctor.findOne({ email });
    if (account) {
      if (!(await account.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = signToken(account._id, "doctor");
      return res.json({
        token,
        user: {
          id: account._id,
          name: account.name,
          email: account.email,
          role: "doctor",
        },
      });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protected — works for both users and doctors)
export const getMe = (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    },
  });
};
