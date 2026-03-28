import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6 },
    phone: { type: String, required: [true, "Phone is required"], trim: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    profilePhoto: { type: String, default: "" },

    // Professional
    qualification: { type: String, required: [true, "Qualification is required"], trim: true },
    experience: { type: Number, required: [true, "Years of experience is required"], min: 0 },
    licenseNumber: { type: String, required: [true, "License number is required"], trim: true },
    hospitalName: { type: String, required: [true, "Hospital/Clinic name is required"], trim: true },
    consultationMode: [{ type: String, enum: ["online", "offline", "both"] }],

    // Specialization
    expertise: [{ type: String }],
    commonAreas: [{ type: String }],

    // Availability: each entry defines a weekday + daily patient limit
    availability: [
      {
        day: {
          type: String,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
        limit: { type: Number, default: 10, min: 1 },
      },
    ],

    // Leaves: specific calendar dates doctor is unavailable
    leaves: [{ type: Date }],

    role: { type: String, default: "doctor" },
  },
  { timestamps: true }
);

doctorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

doctorSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("Doctor", doctorSchema);
