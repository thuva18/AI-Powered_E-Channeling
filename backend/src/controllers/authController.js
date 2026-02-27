const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

// @desc    Register a new doctor
// @route   POST /api/v1/auth/doctor/register
// @access  Public
const registerDoctor = async (req, res) => {
    const { email, password, firstName, lastName, slmcNumber, specialization, phone } = req.body;

    // Validate phone format before hitting the DB
    if (!phone || !/^(07\d{8}|\+94\d{9})$/.test(phone.trim())) {
        return res.status(400).json({
            message: 'Phone number must be in the format 07XXXXXXXX or +94XXXXXXXXX',
        });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const doctorExists = await Doctor.findOne({ slmcNumber });
        if (doctorExists) {
            return res.status(400).json({ message: 'SLMC Number already registered' });
        }

        // Create User account
        const user = await User.create({
            email,
            passwordHash: password, // will be hashed by pre-save hook
            role: 'DOCTOR',
        });

        // Create Doctor profile
        const doctor = await Doctor.create({
            userId: user._id,
            firstName,
            lastName,
            slmcNumber,
            phone: phone.trim(),
            specialization,
            approvalStatus: 'PENDING',
        });

        res.status(201).json({
            message: 'Doctor registered successfully. Awaiting Admin approval.',
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
            },
            doctor: {
                _id: doctor._id,
                slmcNumber: doctor.slmcNumber,
                phone: doctor.phone,
                approvalStatus: doctor.approvalStatus,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const responseData = {
                _id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            };

            // If doctor, additionally send doctor info and approval status
            if (user.role === 'DOCTOR') {
                const doctor = await Doctor.findOne({ userId: user._id });
                if (doctor) {
                    responseData.doctorId = doctor._id;
                    responseData.approvalStatus = doctor.approvalStatus;
                    responseData.firstName = doctor.firstName;
                    responseData.lastName = doctor.lastName;
                    responseData.phone = doctor.phone;
                }
            }

            res.json(responseData);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    registerDoctor,
    loginUser,
};
