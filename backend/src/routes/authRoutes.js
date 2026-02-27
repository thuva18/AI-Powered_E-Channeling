const express = require('express');
const router = express.Router();
const { registerDoctor, loginUser } = require('../controllers/authController');

// @route   POST /api/v1/auth/doctor/register
router.post('/doctor/register', registerDoctor);

// @route   POST /api/v1/auth/login
router.post('/login', loginUser);

module.exports = router;
