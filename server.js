require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 📌 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 📌 User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  clientType: { type: String, enum: ["client", "talent"], required: true },
  education: {
    school: { type: String, required: true },
    hasGraduated: { type: Boolean, required: true }, 
    graduationYear: { type: Number, required: function () { return !this.education.hasGraduated; } }
  },
  organization: [{ 
    type: String, 
    enum: [
      "Women-Led", "Artificial Intelligence", "Startups", "Disruptors",
      "Sustainable", "B Corp Certified", "Tech Unicorns", "Social Impact",
      "Direct-to-Consumer", "FinTech", "Lifestyle", "Subscription-Based",
      "High Growth", "Transformation", "Large Enterprise"
    ] 
  }],
  preferences: {
    categories: [
      { type: String, enum: ["Strategy", "Growth", "Finance", "Technology", "Non-Profits"] }
    ],
    tags: [{ type: String }]
  },
  referralSource: [{ 
    type: String, 
    enum: [
      "Friend or colleague", 
      "Newsletter", 
      "Google Search", 
      "Career Services Office", 
      "Professor or Academic Advisor", 
      "LinkedIn", 
      "Other"
    ] 
  }],
  otp: String,
  otpExpires: Date,
  verified: { type: Boolean, default: false },
});

const User = mongoose.model("User", UserSchema);

// 📌 Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
app.get("/", (req, res) => {
    res.send("Backend is working");
  });

// 📌 REGISTER USER
app.post("/register", async (req, res) => {
  try {
    const { email, clientType, education, organization, preferences, referralSource } = req.body;

    let existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 5 * 60000); // OTP expires in 5 min

    // Ensure graduationYear is only stored when not graduated
    const userEducation = {
      school: education.school,
      hasGraduated: education.hasGraduated,
    };
    if (!education.hasGraduated) {
      userEducation.graduationYear = education.graduationYear;
    }

    const newUser = new User({
      email,
      clientType,
      education: userEducation,
      organization,
      preferences,
      referralSource,
      otp,
      otpExpires,
      verified: false,
    });

    await newUser.save();

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Your OTP for verification is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered, OTP sent" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 VERIFY EMAIL
app.post("/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ error: "User already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Mark user as verified
    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 RESEND OTP
app.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ error: "User already verified" });
    }

    // Generate New OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    user.otp = newOtp;
    user.otpExpires = new Date(Date.now() + 5 * 60000); // OTP expires in 5 min
    await user.save();

    // Send OTP Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your New OTP",
      text: `Your new OTP is: ${newOtp}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "New OTP sent to email" });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
