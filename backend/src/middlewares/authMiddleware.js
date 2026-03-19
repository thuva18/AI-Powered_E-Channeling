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

