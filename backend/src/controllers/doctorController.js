const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// @desc    Get logged in doctor profile
// @route   GET /api/v1/doctors/profile
// @access  Private/Doctor
const getProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'email role');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update doctor profile (bio, fees, etc.)
// @route   PUT /api/v1/doctors/profile
// @access  Private/Doctor
const updateProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { firstName, lastName, specialization, consultationFee, profileDetails, phone } = req.body;

        doctor.firstName = firstName || doctor.firstName;
        doctor.lastName = lastName || doctor.lastName;
        doctor.specialization = specialization || doctor.specialization;
        doctor.consultationFee = consultationFee !== undefined ? consultationFee : doctor.consultationFee;

        if (phone !== undefined) {
            if (!/^(07\d{8}|\+94\d{9})$/.test(phone.trim())) {
                return res.status(400).json({
                    message: 'Phone number must be in the format 07XXXXXXXX or +94XXXXXXXXX',
                });
            }
            doctor.phone = phone.trim();
        }

        if (profileDetails) {
            doctor.profileDetails.bio = profileDetails.bio !== undefined ? profileDetails.bio : doctor.profileDetails.bio;
            doctor.profileDetails.qualifications = profileDetails.qualifications || doctor.profileDetails.qualifications;
            doctor.profileDetails.experienceYears = profileDetails.experienceYears !== undefined ? profileDetails.experienceYears : doctor.profileDetails.experienceYears;
            doctor.profileDetails.contactNumber = profileDetails.contactNumber || doctor.profileDetails.contactNumber;
        }

        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update doctor availability
// @route   PUT /api/v1/doctors/availability
// @access  Private/Doctor
const updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body; // array of availability objects
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        doctor.availability = availability;
        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor.availability);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get doctor appointments
// @route   GET /api/v1/doctors/appointments
// @access  Private/Doctor
const getAppointments = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const appointments = await Appointment.find({ doctorId: doctor._id })
            .populate('patientId', 'email')
            .sort({ appointmentDate: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Accept/Reject appointment
// @route   PATCH /api/v1/doctors/appointments/:id/status
// @access  Private/Doctor
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
        const doctor = await Doctor.findOne({ userId: req.user._id });

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== doctor._id.toString()) {
            return res.status(401).json({ message: 'Not authorized for this appointment' });
        }

        appointment.status = status;
        const updatedAppointment = await appointment.save();

        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get dashboard analytics (revenue, appointments, peer comparison)
// @route   GET /api/v1/doctors/analytics
// @access  Private/Doctor
const getAnalytics = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // ── 1. Basic counts ──────────────────────────────────────────────────
        const [allApts, paid, pending, completed, accepted, rejected] = await Promise.all([
            Appointment.countDocuments({ doctorId: doctor._id }),
            Appointment.countDocuments({ doctorId: doctor._id, paymentStatus: 'PAID' }),
            Appointment.countDocuments({ doctorId: doctor._id, status: 'PENDING' }),
            Appointment.countDocuments({ doctorId: doctor._id, status: 'COMPLETED' }),
            Appointment.countDocuments({ doctorId: doctor._id, status: 'ACCEPTED' }),
            Appointment.countDocuments({ doctorId: doctor._id, status: 'REJECTED' }),
        ]);

        // ── 2. Total revenue from consultationFeeCharged ────────────────────
        const revenueAgg = await Appointment.aggregate([
            { $match: { doctorId: doctor._id, paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$consultationFeeCharged' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        // ── 3. Monthly revenue & appointment count (last 6 months) ──────────
        const monthlyData = await Appointment.aggregate([
            { $match: { doctorId: doctor._id, appointmentDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$appointmentDate' },
                        month: { $month: '$appointmentDate' },
                    },
                    revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$consultationFeeCharged', 0] } },
                    appointments: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyChartData = monthlyData.map(m => ({
            month: MONTH_NAMES[m._id.month - 1],
            revenue: m.revenue,
            appointments: m.appointments,
        }));

        // ── 4. Peer comparison (same specialization, anonymized) ─────────────
        const peers = await Doctor.find({
            specialization: doctor.specialization,
            approvalStatus: 'APPROVED',
            _id: { $ne: doctor._id },
        }).select('_id');

        const peerStats = await Promise.all(
            peers.map(async (peer, idx) => {
                const [revAgg, totalApts] = await Promise.all([
                    Appointment.aggregate([
                        { $match: { doctorId: peer._id, paymentStatus: 'PAID' } },
                        { $group: { _id: null, total: { $sum: '$consultationFeeCharged' } } },
                    ]),
                    Appointment.countDocuments({ doctorId: peer._id }),
                ]);
                return {
                    label: `Peer ${idx + 1}`,
                    revenue: revAgg[0]?.total || 0,
                    appointments: totalApts,
                };
            })
        );

        const meStats = { label: 'You', revenue: totalRevenue, appointments: allApts };
        const comparisonData = [meStats, ...peerStats].sort((a, b) => b.revenue - a.revenue);

        // ── 5. Status distribution ───────────────────────────────────────────
        const statusDistribution = [
            { name: 'Completed', value: completed },
            { name: 'Accepted', value: accepted },
            { name: 'Pending', value: pending },
            { name: 'Rejected', value: rejected },
        ];

        res.json({
            totalAppointments: allApts,
            pendingAppointments: pending,
            completedAppointments: completed,
            totalRevenue,
            monthlyChartData,
            statusDistribution,
            comparisonData,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateAvailability,
    getAppointments,
    updateAppointmentStatus,
    getAnalytics
};
