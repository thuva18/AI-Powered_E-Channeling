const express = require('express');
const router = express.Router();
const {
    getApprovedDoctors,
    getMyAppointments,
    bookAppointment,
    cancelAppointment,
    getMyProfile,
    updateMyProfile,
} = require('../controllers/patientController');
const { protect, patientOnly } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(patientOnly);

router.route('/profile').get(getMyProfile).put(updateMyProfile);
router.get('/doctors', getApprovedDoctors);
router.get('/appointments', getMyAppointments);
router.post('/appointments', bookAppointment);
router.patch('/appointments/:id/cancel', cancelAppointment);

module.exports = router;
