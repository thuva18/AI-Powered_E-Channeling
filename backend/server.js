require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", service: "patient-module-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);

const port = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
});