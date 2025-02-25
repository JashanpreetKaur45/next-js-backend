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