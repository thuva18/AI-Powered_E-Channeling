const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.js");
const { getMyPayments } = require("../controllers/paymentController");

router.get("/my", authRequired, requireRole("patient"), getMyPayments);

module.exports = router;