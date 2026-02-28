const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateAvailability,
    getAppointments,
    updateAppointmentStatus,
    getAnalytics,
} = require('../controllers/doctorController');
const { getJournals, createJournal, updateJournal, deleteJournal } = require('../controllers/journalController');
const { protect, doctorOnly } = require('../middlewares/authMiddleware');

// All routes here are protected and require DOCTOR role
router.use(protect);
router.use(doctorOnly);

router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

router.put('/availability', updateAvailability);

router.get('/appointments', getAppointments);
router.patch('/appointments/:id/status', updateAppointmentStatus);

router.get('/analytics', getAnalytics);

// Journal — CRUD
router.route('/journal').get(getJournals).post(createJournal);
router.route('/journal/:id').put(updateJournal).delete(deleteJournal);

module.exports = router;
