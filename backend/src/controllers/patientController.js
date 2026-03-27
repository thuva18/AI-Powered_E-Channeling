const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
<<<<<<< Updated upstream
const User = require('../models/User');
const Journal = require('../models/Journal');

// Keyword → specialization map for AI-style recommendation
const KEYWORD_SPEC_MAP = {
=======
const User = require('../models/User');
const Journal = require('../models/Journal');

const sendServerError = (res, error) =>
    res.status(500).json({ message: error?.message || 'Server Error' });

// Keyword to specialization map for symptom-based sorting
const KEYWORD_SPEC_MAP = {
>>>>>>> Stashed changes
    heart: 'Cardiologist',
    chest: 'Cardiologist',
    cardiac: 'Cardiologist',
    palpitation: 'Cardiologist',
    blood: 'Cardiologist',
    skin: 'Dermatologist',
    rash: 'Dermatologist',
    acne: 'Dermatologist',
    eczema: 'Dermatologist',
    derma: 'Dermatologist',
    headache: 'Neurologist',
    migraine: 'Neurologist',
    seizure: 'Neurologist',
    memory: 'Neurologist',
    nerve: 'Neurologist',
    stomach: 'Gastroenterologist',
    abdomen: 'Gastroenterologist',
    digestion: 'Gastroenterologist',
    nausea: 'Gastroenterologist',
    bowel: 'Gastroenterologist',
    allergy: 'Allergist',
    asthma: 'Pulmonologist',
    breath: 'Pulmonologist',
    lung: 'Pulmonologist',
    thyroid: 'Endocrinologist',
    diabetes: 'Endocrinologist',
    hormone: 'Endocrinologist',
    child: 'Pediatrician',
    fever: 'General Physician',
    cold: 'General Physician',
    flu: 'General Physician',
    fatigue: 'General Physician',
    joint: 'Rheumatologist',
    arthritis: 'Rheumatologist',
    ear: 'Otolaryngologist',
    throat: 'Otolaryngologist',
    nose: 'Otolaryngologist',
    gynec: 'Gynecologist',
    period: 'Gynecologist',
    pregnancy: 'Gynecologist',
};

// @desc    Get approved doctors list (optionally filtered by symptom keywords)
// @route   GET /api/v1/patients/doctors?symptoms=xxx
// @access  Private/Patient
<<<<<<< Updated upstream
const getApprovedDoctors = async (req, res) => {
    try {
        const { symptoms } = req.query;
=======
const getApprovedDoctors = async (req, res) => {
    try {
        const { symptoms } = req.query;
>>>>>>> Stashed changes
        let doctors = await Doctor.find({ approvalStatus: 'APPROVED', isActive: true })
            .populate('userId', 'email')
            .sort({ 'profileDetails.experienceYears': -1 });

        if (symptoms && symptoms.trim()) {
            const lower = symptoms.toLowerCase();
            const matchedSpecs = new Set();
            Object.entries(KEYWORD_SPEC_MAP).forEach(([kw, spec]) => {
                if (lower.includes(kw)) matchedSpecs.add(spec);
            });

            if (matchedSpecs.size > 0) {
                const matched = doctors.filter(d => matchedSpecs.has(d.specialization));
                // Put matched first, then remaining
                const others = doctors.filter(d => !matchedSpecs.has(d.specialization));
                doctors = [...matched, ...others];
            }
        }

<<<<<<< Updated upstream
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
        return res.json(doctors);
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

// @desc    Get current patient's appointments
// @route   GET /api/v1/patients/appointments
// @access  Private/Patient
<<<<<<< Updated upstream
const getMyAppointments = async (req, res) => {
    try {
=======
const getMyAppointments = async (req, res) => {
    try {
>>>>>>> Stashed changes
        const appointments = await Appointment.find({ patientId: req.user._id })
            .populate({
                path: 'doctorId',
                select: 'firstName lastName specialization consultationFee profileDetails',
            })
            .sort({ appointmentDate: -1 });
<<<<<<< Updated upstream
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
        return res.json(appointments);
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

// @desc    Book a new appointment
// @route   POST /api/v1/patients/appointments
// @access  Private/Patient
<<<<<<< Updated upstream
const bookAppointment = async (req, res) => {
=======
const bookAppointment = async (req, res) => {
>>>>>>> Stashed changes
    const { doctorId, appointmentDate, timeSlot, symptomDescription, symptoms } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
        return res.status(400).json({ message: 'Doctor, date and time slot are required' });
    }

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor || doctor.approvalStatus !== 'APPROVED') {
            return res.status(404).json({ message: 'Doctor not found or not approved' });
        }

        // Check slot not already taken
        const conflict = await Appointment.findOne({
            doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: { $in: ['PENDING', 'ACCEPTED'] },
        });
        if (conflict) {
            return res.status(400).json({ message: 'This time slot is already booked. Please choose another.' });
        }

        const appointment = await Appointment.create({
            doctorId,
            patientId: req.user._id,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            symptomDescription: symptomDescription || '',
            symptoms: symptoms || [],
            consultationFeeCharged: doctor.consultationFee,
            status: 'PENDING',
        });

        const populated = await appointment.populate({
            path: 'doctorId',
            select: 'firstName lastName specialization consultationFee',
        });

<<<<<<< Updated upstream
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
=======
        return res.status(201).json(populated);
    } catch (error) {
        return sendServerError(res, error);
    }
};
>>>>>>> Stashed changes

// @desc    Cancel a patient's own appointment
// @route   PATCH /api/v1/patients/appointments/:id/cancel
// @access  Private/Patient
<<<<<<< Updated upstream
const cancelAppointment = async (req, res) => {
=======
const cancelAppointment = async (req, res) => {
>>>>>>> Stashed changes
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
<<<<<<< Updated upstream
        if (!['PENDING'].includes(appointment.status)) {
            return res.status(400).json({ message: 'Only pending appointments can be cancelled' });
        }
        appointment.status = 'CANCELLED';
        await appointment.save();
        res.json({ message: 'Appointment cancelled', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
        if (appointment.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending appointments can be cancelled' });
        }
        appointment.status = 'CANCELLED';
        await appointment.save();
        return res.json({ message: 'Appointment cancelled', appointment });
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

// @desc    Get current patient's own profile
// @route   GET /api/v1/patients/profile
// @access  Private/Patient
<<<<<<< Updated upstream
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            email: user.email,
            ...user.patientProfile.toObject(),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json({
            email: user.email,
            ...user.patientProfile.toObject(),
        });
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

// @desc    Update current patient's own profile
// @route   PUT /api/v1/patients/profile
// @access  Private/Patient
<<<<<<< Updated upstream
const updateMyProfile = async (req, res) => {
=======
const updateMyProfile = async (req, res) => {
>>>>>>> Stashed changes
    try {
        const { firstName, lastName, phone, nic, dateOfBirth } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (firstName !== undefined) user.patientProfile.firstName = firstName.trim();
        if (lastName !== undefined) user.patientProfile.lastName = lastName.trim();
        if (phone !== undefined) user.patientProfile.phone = phone.trim();
        if (nic !== undefined) user.patientProfile.nic = nic.trim().toUpperCase();
<<<<<<< Updated upstream
        if (dateOfBirth !== undefined) user.patientProfile.dateOfBirth = dateOfBirth;

        await user.save({ validateModifiedOnly: true });
        res.json({ message: 'Profile updated', patientProfile: user.patientProfile });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
=======
        if (dateOfBirth !== undefined) user.patientProfile.dateOfBirth = dateOfBirth;

        await user.save({ validateModifiedOnly: true });
        return res.json({ message: 'Profile updated', patientProfile: user.patientProfile });
    } catch (error) {
        return sendServerError(res, error);
    }
};
>>>>>>> Stashed changes

// @desc    Delete current patient's own profile and account
// @route   DELETE /api/v1/patients/profile
// @access  Private/Patient
<<<<<<< Updated upstream
const deleteMyProfile = async (req, res) => {
=======
const deleteMyProfile = async (req, res) => {
>>>>>>> Stashed changes
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Delete all appointments associated with this patient
        await Appointment.deleteMany({ patientId: userId });

<<<<<<< Updated upstream
        // Delete the user record
        await User.findByIdAndDelete(userId);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
=======
        // Delete the user record
        await User.findByIdAndDelete(userId);

        return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        return sendServerError(res, error);
    }
};
>>>>>>> Stashed changes

// @desc    Get patient analytics (total apps, upcoming, completed, spent)
// @route   GET /api/v1/patients/analytics
// @access  Private/Patient
<<<<<<< Updated upstream
const getPatientAnalytics = async (req, res) => {
=======
const getPatientAnalytics = async (req, res) => {
>>>>>>> Stashed changes
    try {
        const appointments = await Appointment.find({ patientId: req.user._id });

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let upcoming = 0;
        let completed = 0;
        let totalSpent = 0;

        appointments.forEach(apt => {
            if (apt.status === 'COMPLETED') {
                completed++;
                if (apt.consultationFeeCharged) {
                    totalSpent += apt.consultationFeeCharged;
                }
            } else if ((apt.status === 'ACCEPTED' || apt.status === 'PENDING') && new Date(apt.appointmentDate) >= now) {
                upcoming++;
            }
        });

<<<<<<< Updated upstream
        res.json({
            totalAppointments: appointments.length,
            upcomingAppointments: upcoming,
            completedAppointments: completed,
            totalSpent
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
        return res.json({
            totalAppointments: appointments.length,
            upcomingAppointments: upcoming,
            completedAppointments: completed,
            totalSpent
        });
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

// @desc    Get patient's medical history (journals)
// @route   GET /api/v1/patients/journals
// @access  Private/Patient
<<<<<<< Updated upstream
const getJournals = async (req, res) => {
=======
const getJournals = async (req, res) => {
>>>>>>> Stashed changes
    try {
        const journals = await Journal.find({ patientId: req.user._id })
            .populate({
                path: 'doctorId',
                select: 'firstName lastName specialization',
            })
            .sort({ visitDate: -1 });

<<<<<<< Updated upstream
        res.json(journals);
    } catch (error) {
        console.error('getJournals error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
=======
        return res.json(journals);
    } catch (error) {
        return sendServerError(res);
    }
};
>>>>>>> Stashed changes

module.exports = {
    getApprovedDoctors,
    getMyAppointments,
    bookAppointment,
    cancelAppointment,
    getMyProfile,
    updateMyProfile,
    deleteMyProfile,
    getPatientAnalytics,
    getJournals,
};
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
