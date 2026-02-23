const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },

    amount: { type: Number, required: true },
    method: { type: String, default: "Card" }, // Card/Cash/etc.
    status: { type: String, enum: ["Paid", "Pending", "Failed"], default: "Paid" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);