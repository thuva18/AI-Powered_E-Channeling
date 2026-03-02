const express = require('express');
const router = express.Router();
const {
    getPendingDoctors,
    getAllDoctors,
    updateDoctorApprovalStatus,
    deleteDoctor,
    getAnalytics,
    getReportData,
    getAdvancedReportData,
    getAllPatients,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteUser,
    toggleUserActive,
    listSavedReports,
    createSavedReport,
    updateSavedReport,
    deleteSavedReport,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All routes protected and require ADMIN role
router.use(protect);
router.use(adminOnly);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', getAnalytics);
router.get('/report-data', getReportData);
router.get('/advanced-report-data', getAdvancedReportData);

// ── Doctors ───────────────────────────────────────────────────────────────────
router.get('/doctors', getAllDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.patch('/doctors/:id/approve', updateDoctorApprovalStatus);
router.delete('/doctors/:id', deleteDoctor);

// ── Patients ──────────────────────────────────────────────────────────────────
router.get('/patients', getAllPatients);

// ── Admins (CRUD) ─────────────────────────────────────────────────────────────
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.patch('/admins/:id', updateAdmin);

// ── Generic user actions ──────────────────────────────────────────────────────
router.patch('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);

// ── Saved Reports ─────────────────────────────────────────────────────────────
router.route('/saved-reports')
    .get(listSavedReports)
    .post(createSavedReport);

router.route('/saved-reports/:id')
    .put(updateSavedReport)
    .delete(deleteSavedReport);

module.exports = router;