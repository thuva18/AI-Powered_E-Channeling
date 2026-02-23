const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },

    // Auth
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Profile (patient)
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    age: { type: Number, default: null },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);