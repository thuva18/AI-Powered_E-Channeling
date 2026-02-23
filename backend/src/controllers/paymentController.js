const Payment = require("../models/Payment");

exports.getMyPayments = async (req, res) => {
  try {
    const items = await Payment.find({ patientId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};