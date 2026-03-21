import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn("MongoDB connection error:", err.message);
    console.warn("Continuing in development mode without database...");
    return false;
  }
};
