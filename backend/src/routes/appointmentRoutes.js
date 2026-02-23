const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.js");
const { getMyAppointments } = require("../controllers/appointmentController");

router.get("/my", authRequired, requireRole("patient"), getMyAppointments);

module.exports = router;