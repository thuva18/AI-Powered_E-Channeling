const router = require("express").Router();
const { authRequired, requireRole } = require("../middleware/auth.js");
const { getMe, updateMe } = require("../controllers/patientController");

router.get("/me", authRequired, requireRole("patient"), getMe);
router.put("/me", authRequired, requireRole("patient"), updateMe);

module.exports = router;