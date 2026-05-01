const User = require('../models/User');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken');

// @desc    Register a new doctor
// @route   POST /api/v1/auth/doctor/register
// @access  Public
const NIC_REGEX = /^(\d{9}[Vv]|\d{12})$/;
const PHONE_REGEX = /^(07\d{8}|\+94\d{9})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const normalizeNic = (value = '') => value.trim().toUpperCase();
const sendServerError = (res, error) =>
    res.status(500).json({ message: error?.message || 'Server Error' });

const registerDoctor = async (req, res) => {
    const { email, password, firstName, lastName, slmcNumber, specialization, phone, nic } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedPhone = phone?.trim();
    const nicTrimmed = normalizeNic(nic);

    // Fix #2: Validate email format
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate phone format
    if (!trimmedPhone || !PHONE_REGEX.test(trimmedPhone)) {
        return res.status(400).json({
            message: 'Phone number must be in the format 07XXXXXXXX or +94XXXXXXXXX',
        });
    }

    // Validate NIC format
    if (!NIC_REGEX.test(nicTrimmed)) {
        return res.status(400).json({
            message: 'NIC must be 9 digits + V (e.g. 912345678V) or 12 digits (e.g. 200012345678)',
        });
    }

    // Fix #1 + all duplicate checks BEFORE any writes
    try {
        // Fix #1: use normalizedEmail for the duplicate check
        const userExists = await User.findOne({ email: normalizedEmail });
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

        // Fix #6: Use a MongoDB session/transaction so that if Doctor.create
        // fails (e.g. a race-condition uniqueness violation), the User row is
        // rolled back and no orphaned records are left behind.
        const session = await mongoose.startSession();
        let user, doctor;
        try {
            await session.withTransaction(async () => {
                [user] = await User.create(
                    [{ email: normalizedEmail, passwordHash: password, role: 'DOCTOR' }],
                    { session }
                );
                [doctor] = await Doctor.create(
                    [{
                        userId: user._id,
                        firstName,
                        lastName,
                        slmcNumber,
                        nic: nicTrimmed,
                        phone: trimmedPhone,
                        specialization,
                        approvalStatus: 'PENDING',
                    }],
                    { session }
                );
            });
        } finally {
            session.endSession();
        }

        res.status(201).json({
            message: 'Doctor registered successfully. Awaiting Admin approval.',
            user: { _id: user._id, email: user.email, role: user.role },
            doctor: {
                _id: doctor._id,
                slmcNumber: doctor.slmcNumber,
                phone: doctor.phone,
                approvalStatus: doctor.approvalStatus,
            },
        });
    } catch (error) {
        sendServerError(res, error);
    }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    try {
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

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
                Object.assign(responseData, {
                    doctorId: doctor._id,
                    approvalStatus: doctor.approvalStatus,
                    firstName: doctor.firstName,
                    lastName: doctor.lastName,
                    phone: doctor.phone,
                });
            }
        }

        return res.json(responseData);
    } catch (error) {
        sendServerError(res, error);
    }
};

// @desc    Check if NIC is already registered (for real-time form validation)
// @route   GET /api/v1/auth/check-nic?nic=XXXXX
// @access  Public
const checkNicAvailability = async (req, res) => {
    const { nic } = req.query;
    if (!nic) return res.status(400).json({ message: 'NIC query param required' });
    const nicNormalised = normalizeNic(nic);
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
    const normalizedEmail = normalizeEmail(email);
    try {
        const exists = await User.findOne({ email: normalizedEmail });
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
    const normalizedEmail = normalizeEmail(email);
    const normalizedNic = nic ? normalizeNic(nic) : '';

    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Fix #3: NIC is required for patients and must be valid (aligned with frontend)
    if (!normalizedNic) {
        return res.status(400).json({ message: 'NIC number is required' });
    }
    if (!NIC_REGEX.test(normalizedNic)) {
        return res.status(400).json({
            message: 'NIC must be 9 digits + V (e.g. 912345678V) or 12 digits (e.g. 200012345678)',
        });
    }

    try {
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Fix #4: Check patient NIC uniqueness (if a NIC was supplied)
        if (normalizedNic) {
            const nicExists = await User.findOne({ 'patientProfile.nic': normalizedNic });
            if (nicExists) {
                return res.status(400).json({ message: 'An account with this NIC is already registered' });
            }
        }

        const user = await User.create({
            email: normalizedEmail,
            passwordHash: password,
            role: 'PATIENT',
            patientProfile: { firstName, lastName, phone, nic: normalizedNic, dateOfBirth },
        });

        res.status(201).json({
            message: 'Patient registered successfully.',
            user: { _id: user._id, email: user.email, role: user.role },
        });
    } catch (error) {
        sendServerError(res, error);
    }
};

module.exports = {
    registerDoctor,
    loginUser,
    checkNicAvailability,
    checkEmailAvailability,
    registerPatient,
};

