const express = require('express');
const router = express.Router();
const {
    getPendingDoctors,
    getAllDoctors,
    updateDoctorApprovalStatus,
    deleteDoctor,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All routes here are protected and require ADMIN role
router.use(protect);
router.use(adminOnly);

// @route   GET /api/v1/admin/doctors          — all doctors (any status)
router.get('/doctors', getAllDoctors);

// @route   GET /api/v1/admin/doctors/pending  — only PENDING
router.get('/doctors/pending', getPendingDoctors);

// @route   PATCH /api/v1/admin/doctors/:id/approve
router.patch('/doctors/:id/approve', updateDoctorApprovalStatus);

// @route   DELETE /api/v1/admin/doctors/:id
router.delete('/doctors/:id', deleteDoctor);

module.exports = router;