<<<<<<< Updated upstream
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-passwordHash');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as Admin' });
    }
};

const doctorOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'DOCTOR') {
        try {
            const doctor = await Doctor.findOne({ userId: req.user._id });
            req.doctor = doctor;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error checking doctor profile' });
        }
    } else {
        res.status(403).json({ message: 'Not authorized as Doctor' });
    }
};

const patientOnly = (req, res, next) => {
    if (req.user && req.user.role === 'PATIENT') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as Patient' });
    }
};

module.exports = { protect, adminOnly, doctorOnly, patientOnly };
=======
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const getBearerToken = (authorizationHeader) => {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer')) {
        return null;
    }
    return authorizationHeader.split(' ')[1];
};

const ensureRole = (req, res, role, label) => {
    if (req.user && req.user.role === role) return true;
    res.status(403).json({ message: `Not authorized as ${label}` });
    return false;
};

const protect = async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-passwordHash');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const adminOnly = (req, res, next) => (
    ensureRole(req, res, 'ADMIN', 'Admin') ? next() : null
);

const doctorOnly = async (req, res, next) => {
    if (!ensureRole(req, res, 'DOCTOR', 'Doctor')) {
        return;
    }

    try {
        req.doctor = await Doctor.findOne({ userId: req.user._id });
        return next();
    } catch (error) {
        return res.status(500).json({ message: 'Error checking doctor profile' });
    }
};

const patientOnly = (req, res, next) => (
    ensureRole(req, res, 'PATIENT', 'Patient') ? next() : null
);

module.exports = { protect, adminOnly, doctorOnly, patientOnly };
>>>>>>> Stashed changes

