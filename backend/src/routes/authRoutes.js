const express = require('express');
const router = express.Router();
const { registerDoctor, loginUser, checkNicAvailability } = require('../controllers/authController');

// @route   POST /api/v1/auth/doctor/register
router.post('/doctor/register', registerDoctor);

// @route   POST /api/v1/auth/login
router.post('/login', loginUser);

// @route   GET /api/v1/auth/check-nic?nic=XXXXX
router.get('/check-nic', checkNicAvailability);

module.exports = router;
