const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Patient not found" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const allowed = ["fullName", "phone", "address", "age", "gender"];
    const updates = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "Patient not found" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};