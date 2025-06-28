import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  otp: String,
  otpExpiresAt: Date,
});

export default mongoose.model("User", userSchema);
