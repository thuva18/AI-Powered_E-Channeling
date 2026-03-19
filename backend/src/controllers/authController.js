const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

// @desc    Register a new doctor
// @route   POST /api/v1/auth/doctor/register
// @access  Public
const NIC_REGEX = /^(\d{9}[Vv]|\d{12})$/;

const registerDoctor = async (req, res) => {
    const { email, password, firstName, lastName, slmcNumber, specialization, phone, nic } = req.body;

    // Validate phone format
    if (!phone || !/^(07\d{8}|\+94\d{9})$/.test(phone.trim())) {
        return res.status(400).json({
            message: 'Phone number must be in the format 07XXXXXXXX or +94XXXXXXXXX',
        });
    }

    // Validate NIC format
    const nicTrimmed = (nic || '').trim().toUpperCase();
    if (!NIC_REGEX.test(nicTrimmed)) {
        return res.status(400).json({
            message: 'NIC must be 9 digits + V (e.g. 912345678V) or 12 digits (e.g. 200012345678)',
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

        const nicExists = await Doctor.findOne({ nic: nicTrimmed });
        if (nicExists) {
            return res.status(400).json({ message: 'A doctor with this NIC is already registered' });
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
            nic: nicTrimmed,
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

// @desc    Check if NIC is already registered (for real-time form validation)
// @route   GET /api/v1/auth/check-nic?nic=XXXXX
// @access  Public
const checkNicAvailability = async (req, res) => {
    const { nic } = req.query;
    if (!nic) return res.status(400).json({ message: 'NIC query param required' });
    const nicNormalised = nic.trim().toUpperCase();
    try {
        const exists = await Doctor.findOne({ nic: nicNormalised });
        res.json({ available: !exists });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Check if email is already registered (for patient registration form)
// @route   GET /api/v1/auth/check-email?email=XXXXX
// @access  Public
const checkEmailAvailability = async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query param required' });
    try {
        const exists = await User.findOne({ email: email.trim().toLowerCase() });
        res.json({ available: !exists });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new patient
// @route   POST /api/v1/auth/patient/register
// @access  Public
const registerPatient = async (req, res) => {
    const { email, password, firstName, lastName, phone, nic, dateOfBirth } = req.body;

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        const userExists = await User.findOne({ email: email.trim().toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const user = await User.create({
            email: email.trim().toLowerCase(),
            passwordHash: password,
            role: 'PATIENT',
            // Store patient profile data directly on the User document via a patientProfile subdoc
            patientProfile: { firstName, lastName, phone, nic: nic ? nic.trim().toUpperCase() : '', dateOfBirth },
        });

        res.status(201).json({
            message: 'Patient registered successfully.',
            user: { _id: user._id, email: user.email, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = {
    registerDoctor,
    loginUser,
    checkNicAvailability,
    checkEmailAvailability,
    registerPatient,
};

