const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Optional: booking module may assign these
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    dateTime: { type: Date, required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);