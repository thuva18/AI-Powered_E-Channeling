const Appointment = require("../models/Appointment");

exports.getMyAppointments = async (req, res) => {
  try {
    const items = await Appointment.find({ patientId: req.user.id })
      .sort({ dateTime: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};