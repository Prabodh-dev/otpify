import User from "../models/User.js";
import { generateOTP } from "../utils/otp.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const sendSms = async (phone, otp) => {
  console.log(`Sending OTP ${otp} to ${phone}`);
};

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number is required" });

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendSms(phone, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp)
    return res.status(400).json({ message: "Phone and OTP are required" });

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.otpExpiresAt < new Date()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // OTP verified, clear OTP
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = jwt.sign(
    { id: user._id, phone: user.phone },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({ message: "OTP verified", token });
};
