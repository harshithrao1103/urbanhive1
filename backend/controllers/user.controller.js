import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config.js";
import sendMail from "../utils/sendEmail.js";
import { addPoints, addDailyLoginPoints } from "../utils/points.js";


// REGISTER
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log("Register Request Body:", req.body);

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Email is not valid" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Send welcome email
    sendMail(newUser.email, "Registered to CivicSphere successfully!");

    const savedUser = await newUser.save();

    // 🎯 Add 500 signup points
    await addPoints(savedUser._id, 500, "Signup Bonus");

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "5d" }
    );

    // 🎯 Add daily login point (only once per day)
    await addDailyLoginPoints(user._id);

    return res
      .cookie("token", token, { httpOnly: true, secure: false })
      .json({
        message: "Login successful",
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGOUT
export const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

// GET USER BY ID
export const getUser = async (req, res) => {
  console.log("Get User Request:", req.params.id);
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user,
      message: "User fetched successfully",
    });
  } catch (err) {
    console.error("Get User Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Leaderboard - Top users by points
export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ name: { $ne: "demo" } })
      .sort({ points: -1 })
      .select("name points");

    res.json({ success: true, users });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

