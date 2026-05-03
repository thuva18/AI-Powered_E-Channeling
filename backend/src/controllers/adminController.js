const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');
const SavedReport = require('../models/SavedReport');
const Preset = require('../models/Preset');
const { deleteDoctorAccountByUserId } = require('../utils/deleteDoctorAccount');

const SUCCESS_TRANSACTION_STATUSES = ['SUCCESS', 'APPROVED'];
const DOCTOR_APPROVAL_STATUS_OPTIONS = ['APPROVED', 'REJECTED'];
const WEEKDAY_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_PASSWORD_LENGTH = 6;

const sendServerError = (res, error, exposeMessage = false) =>
    res.status(500).json({ message: exposeMessage ? (error?.message || 'Server Error') : 'Server Error' });

const getDateRange = (dateFrom, dateTo) => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return { from, to };
};

// @desc    Get all pending doctor registrations
// @route   GET /api/v1/admin/doctors/pending
// @access  Private/Admin
const getPendingDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ approvalStatus: 'PENDING' }).populate('userId', 'email');
        res.json(doctors);
    } catch (error) {
        sendServerError(res);
    }
};

// @desc    Get ALL doctors (any approval status)
// @route   GET /api/v1/admin/doctors
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .populate('userId', 'email')
            .sort({ createdAt: -1 });
        res.json(doctors);
    } catch (error) {
        console.error('getAllDoctors error:', error);
        sendServerError(res);
    }
};

// @desc    Approve or reject doctor registration
// @route   PATCH /api/v1/admin/doctors/:id/approve
// @access  Private/Admin
const updateDoctorApprovalStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!DOCTOR_APPROVAL_STATUS_OPTIONS.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.approvalStatus = status;
        doctor.isActive = status === 'APPROVED';
        const updatedDoctor = await doctor.save({ validateModifiedOnly: true });

        res.json({ message: `Doctor status updated to ${status}`, doctor: updatedDoctor });
    } catch (error) {
        console.error('Admin approval error:', error);
        sendServerError(res, error, true);
    }
};

// @desc    Delete/Remove doctor account entirely
// @route   DELETE /api/v1/admin/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        await deleteDoctorAccountByUserId(doctor.userId);

        res.json({ message: 'Doctor account permanently deleted' });
    } catch (error) {
        sendServerError(res);
    }
};

// @desc    Get platform analytics + recent activity
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // ── User counts ──────────────────────────────────────────────────────────
        const [totalPatients, totalDoctors, totalAdmins] = await Promise.all([
            User.countDocuments({ role: 'PATIENT' }),
            User.countDocuments({ role: 'DOCTOR' }),
            User.countDocuments({ role: 'ADMIN' }),
        ]);
        const newPatientsThisMonth = await User.countDocuments({
            role: 'PATIENT', createdAt: { $gte: thirtyDaysAgo },
        });
        const newDoctorsThisMonth = await User.countDocuments({
            role: 'DOCTOR', createdAt: { $gte: thirtyDaysAgo },
        });

        // ── Doctor approval breakdown ────────────────────────────────────────────
        const [pendingDoctors, approvedDoctors, rejectedDoctors] = await Promise.all([
            Doctor.countDocuments({ approvalStatus: 'PENDING' }),
            Doctor.countDocuments({ approvalStatus: 'APPROVED' }),
            Doctor.countDocuments({ approvalStatus: 'REJECTED' }),
        ]);

        // ── Appointment stats ────────────────────────────────────────────────────
        const [totalAppointments, pendingAppts, acceptedAppts, completedAppts, cancelledAppts] = await Promise.all([
            Appointment.countDocuments(),
            Appointment.countDocuments({ status: 'PENDING' }),
            Appointment.countDocuments({ status: 'ACCEPTED' }),
            Appointment.countDocuments({ status: 'COMPLETED' }),
            Appointment.countDocuments({ status: 'CANCELLED' }),
        ]);
        const newApptsThisWeek = await Appointment.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        });

        // ── Appointments by day (last 7 days for sparkline) ───────────────────────
        const apptsByDay = await Appointment.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
        ]);

        // ── Payment / Revenue stats ─────────────────────────────────────────────
        const revResult = await Transaction.aggregate([
            { $match: { status: { $in: SUCCESS_TRANSACTION_STATUSES } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);
        const revenue = revResult[0] || { total: 0, count: 0 };

        const pendingPayments = await Transaction.countDocuments({ status: 'PENDING_APPROVAL' });

        const revenueThisMonth = await Transaction.aggregate([
            { $match: { status: { $in: SUCCESS_TRANSACTION_STATUSES }, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Revenue by method
        const revenueByMethod = await Transaction.aggregate([
            { $match: { status: { $in: SUCCESS_TRANSACTION_STATUSES } } },
            { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]);

        // ── Top specializations (by appointment count) ───────────────────────────
        const topSpecs = await Appointment.aggregate([
            { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
            { $unwind: '$doctor' },
            { $group: { _id: '$doctor.specialization', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // ── Recent activity (last 5 transactions + last 5 appointments) ──────────
        const recentTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patientId', 'email patientProfile')
            .populate({ path: 'appointmentId', populate: { path: 'doctorId', select: 'firstName lastName' } });

        const recentDoctors = await Doctor.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'email createdAt');

        res.json({
            users: { totalPatients, totalDoctors, totalAdmins, newPatientsThisMonth, newDoctorsThisMonth },
            doctors: { pending: pendingDoctors, approved: approvedDoctors, rejected: rejectedDoctors },
            appointments: { total: totalAppointments, pending: pendingAppts, accepted: acceptedAppts, completed: completedAppts, cancelled: cancelledAppts, newThisWeek: newApptsThisWeek, byDay: apptsByDay },
            payments: { totalRevenue: revenue.total, paidCount: revenue.count, pendingApproval: pendingPayments, revenueThisMonth: revenueThisMonth[0]?.total || 0, byMethod: revenueByMethod },
            topSpecializations: topSpecs,
            recentTransactions,
            recentDoctors,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        sendServerError(res);
    }
};

// @desc  Flexible report data for a custom date range
// @route GET /api/v1/admin/report-data?dateFrom=&dateTo=
// @access Private/Admin
const getReportData = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        if (!dateFrom || !dateTo) return res.status(400).json({ message: 'dateFrom and dateTo are required' });

        const { from, to } = getDateRange(dateFrom, dateTo);

        const apptFilter = { createdAt: { $gte: from, $lte: to } };
        const txnFilter = { createdAt: { $gte: from, $lte: to }, status: { $in: SUCCESS_TRANSACTION_STATUSES } };

        const totalApptsForCheck = await Appointment.countDocuments(apptFilter);
        const totalTxnsForCheck = await Transaction.countDocuments(txnFilter);

        if (totalApptsForCheck === 0 && totalTxnsForCheck === 0) {
            return res.json({
                success: true,
                message: "No report data found for the selected date range.",
                dateFrom, dateTo,
                appointments: { total: 0, completed: 0, accepted: 0, pending: 0, cancelled: 0, byDay: [], topSpecializations: [] },
                doctorRevenue: [],
                payments: { totalRevenue: 0, paidCount: 0, successRate: 100, refunds: 0, byMethod: [] },
            });
        }

        // ── Appointment counts ─────────────────────────────────────────────────
        const [total, completed, accepted, pending, cancelled] = await Promise.all([
            Appointment.countDocuments(apptFilter),
            Appointment.countDocuments({ ...apptFilter, status: 'COMPLETED' }),
            Appointment.countDocuments({ ...apptFilter, status: 'ACCEPTED' }),
            Appointment.countDocuments({ ...apptFilter, status: 'PENDING' }),
            Appointment.countDocuments({ ...apptFilter, status: 'CANCELLED' }),
        ]);

        // ── Appointments by day of week ────────────────────────────────────────
        const byDayRaw = await Appointment.aggregate([
            { $match: apptFilter },
            { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
        ]);
        const byDay = byDayRaw.map(d => ({ day: WEEKDAY_NAMES[d._id], count: d.count }));

        // ── Top specializations ────────────────────────────────────────────────
        const topSpecializations = await Appointment.aggregate([
            { $match: apptFilter },
            { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
            { $unwind: '$doctor' },
            { $group: { _id: '$doctor.specialization', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
        ]);

        // ── Doctor revenue ─────────────────────────────────────────────────────
        const doctorRevenue = await Transaction.aggregate([
            { $match: txnFilter },
            { $lookup: { from: 'appointments', localField: 'appointmentId', foreignField: '_id', as: 'apt' } },
            { $unwind: '$apt' },
            { $lookup: { from: 'doctors', localField: 'apt.doctorId', foreignField: '_id', as: 'doc' } },
            { $unwind: '$doc' },
            {
                $group: {
                    _id: '$doc._id',
                    firstName: { $first: '$doc.firstName' },
                    lastName: { $first: '$doc.lastName' },
                    specialization: { $first: '$doc.specialization' },
                    appointments: { $sum: 1 },
                    revenue: { $sum: '$amount' },
                }
            },
            { $sort: { revenue: -1 } },
        ]);

        // ── Payment details ────────────────────────────────────────────────────
        const revResult = await Transaction.aggregate([{ $match: txnFilter }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
        const byMethod = await Transaction.aggregate([{ $match: txnFilter }, { $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { amount: -1 } }]);
        const failedCount = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to }, status: 'FAILED' });
        const refundCount = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to }, status: 'REJECTED' });
        const paymentCount = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to } });
        const successRate = paymentCount > 0 ? +((paymentCount - failedCount - refundCount) / paymentCount * 100).toFixed(1) : 100;

        res.json({
            dateFrom, dateTo,
            appointments: { total, completed, accepted, pending, cancelled, byDay, topSpecializations },
            doctorRevenue,
            payments: { totalRevenue: revResult[0]?.total || 0, paidCount: revResult[0]?.count || 0, successRate, refunds: refundCount, byMethod },
        });
    } catch (error) {
        console.error('Report data error:', error);
        sendServerError(res);
    }
};

// @desc  Advanced report data — doctor performance, peak hours, cancellation, financial
// @route GET /api/v1/admin/advanced-report-data?dateFrom=&dateTo=&doctorIds=
const getAdvancedReportData = async (req, res) => {
    try {
        const { dateFrom, dateTo, doctorIds } = req.query;
        if (!dateFrom || !dateTo) return res.status(400).json({ message: 'dateFrom and dateTo are required' });

        const { from, to } = getDateRange(dateFrom, dateTo);
        const apptFilter = { createdAt: { $gte: from, $lte: to } };
        const txnFilter = { createdAt: { $gte: from, $lte: to }, status: { $in: SUCCESS_TRANSACTION_STATUSES } };
        const selectedDoctorIds = doctorIds ? doctorIds.split(',').filter(Boolean) : [];

        // ── Doctor list (for selector) ─────────────────────────────────────────
        const allDoctors = await Doctor.find({ approvalStatus: 'APPROVED' }).select('firstName lastName specialization').lean();

        // Doctor filter for appointment queries
        const docFilter = selectedDoctorIds.length > 0
            ? { ...apptFilter, doctorId: { $in: selectedDoctorIds } }
            : apptFilter;

        // ── Check for empty data ───────────────────────────────────────────────
        const totalApptsForCheck = await Appointment.countDocuments(docFilter);
        const totalTxnsForCheck = await Transaction.countDocuments(txnFilter);

        if (totalApptsForCheck === 0 && totalTxnsForCheck === 0) {
            return res.json({
                success: true,
                message: "No report data found for the selected date range.",
                dateFrom, dateTo,
                allDoctors,
                appointments: { total: 0, completed: 0, accepted: 0, pending: 0, cancelled: 0, topSpecializations: [] },
                financial: { total: 0, count: 0, avg: 0, successRate: 100, refunds: 0, failed: 0, byMethod: [], dailyRevenue: [] },
                cancellation: { total: 0, rate: 0, byDay: [], byDoctor: [] },
                doctorPerformance: [],
                peakHours: [],
            });
        }

        // ── Peak Hours ─────────────────────────────────────────────────────────
        // timeSlot field stored as "09:00 AM" or "09:00" — extract hour
        const peakHoursRaw = await Appointment.aggregate([
            { $match: { ...docFilter, timeSlot: { $exists: true, $ne: null } } },
            {
                $project: {
                    hour: {
                        $convert: {
                            input: { $arrayElemAt: [{ $split: [{ $ifNull: ['$timeSlot', '0:00'] }, ':'] }, 0] },
                            to: 'int',
                            onError: -1,
                            onNull: -1
                        }
                    }
                }
            },
            { $match: { hour: { $gte: 0, $lte: 23 } } },
            { $group: { _id: '$hour', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 24 },
        ]);
        const peakHours = peakHoursRaw
            .filter(h => h._id !== null && h._id !== undefined)
            .map(h => ({
                hour: h._id,
                label: `${String(h._id).padStart(2, '0')}:00`,
                displayLabel: h._id < 12
                    ? `${h._id === 0 ? 12 : h._id}:00 AM`
                    : `${h._id === 12 ? 12 : h._id - 12}:00 PM`,
                count: h.count,
            }))
            .sort((a, b) => a.hour - b.hour);

        // ── Cancellation Analysis ──────────────────────────────────────────────
        const cancelledFilter = { ...docFilter, status: 'CANCELLED' };
        const totalAppts = await Appointment.countDocuments(docFilter);
        const totalCancelled = await Appointment.countDocuments(cancelledFilter);

        // Cancellation by day of week
        const cancelByDayRaw = await Appointment.aggregate([
            { $match: cancelledFilter },
            { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
        ]);
        const cancelByDay = cancelByDayRaw.map(d => ({ day: WEEKDAY_NAMES[d._id], count: d.count }));

        // Top 5 doctors by cancellation count
        const cancelByDoctor = await Appointment.aggregate([
            { $match: { ...docFilter, status: 'CANCELLED' } },
            { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doc' } },
            { $unwind: '$doc' },
            { $group: { _id: '$doc._id', name: { $first: { $concat: ['Dr. ', '$doc.firstName', ' ', '$doc.lastName'] } }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        // ── Doctor Performance ─────────────────────────────────────────────────
        const doctorPerformance = await Appointment.aggregate([
            { $match: docFilter },
            { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doc' } },
            { $unwind: '$doc' },
            {
                $group: {
                    _id: '$doc._id',
                    name: { $first: { $concat: ['$doc.firstName', ' ', '$doc.lastName'] } },
                    specialization: { $first: '$doc.specialization' },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
                }
            },
            { $sort: { total: -1 } },
        ]);
        // Add completion rate
        const doctorPerf = doctorPerformance.map(d => ({
            ...d,
            completionRate: d.total > 0 ? +(d.completed / d.total * 100).toFixed(1) : 0,
            cancellationRate: d.total > 0 ? +(d.cancelled / d.total * 100).toFixed(1) : 0,
        }));

        // ── Financial Summary ──────────────────────────────────────────────────
        // Daily revenue trend
        const dailyRevenue = await Transaction.aggregate([
            { $match: txnFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                }
            },
            { $sort: { '_id': 1 } },
        ]);

        const financialSummary = await Transaction.aggregate([
            { $match: txnFilter },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, avg: { $avg: '$amount' } } },
        ]);
        const refundCount = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to }, status: 'REJECTED' });
        const failedCount = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to }, status: 'FAILED' });
        const totalTxns = await Transaction.countDocuments({ createdAt: { $gte: from, $lte: to } });
        const successRate = totalTxns > 0 ? +((totalTxns - failedCount - refundCount) / totalTxns * 100).toFixed(1) : 100;

        const byMethod = await Transaction.aggregate([
            { $match: txnFilter },
            { $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { amount: -1 } },
        ]);

        // ── Appointment Summary ────────────────────────────────────────────────
        const [total, completed, accepted, pending, cancelled] = await Promise.all([
            Appointment.countDocuments(docFilter),
            Appointment.countDocuments({ ...docFilter, status: 'COMPLETED' }),
            Appointment.countDocuments({ ...docFilter, status: 'ACCEPTED' }),
            Appointment.countDocuments({ ...docFilter, status: 'PENDING' }),
            Appointment.countDocuments({ ...docFilter, status: 'CANCELLED' }),
        ]);
        const topSpecializations = await Appointment.aggregate([
            { $match: docFilter },
            { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doc' } },
            { $unwind: '$doc' },
            { $group: { _id: '$doc.specialization', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
        ]);

        res.json({
            dateFrom, dateTo,
            allDoctors,
            peakHours,
            cancellation: { total: totalCancelled, rate: totalAppts > 0 ? +(totalCancelled / totalAppts * 100).toFixed(1) : 0, byDay: cancelByDay, byDoctor: cancelByDoctor },
            doctorPerformance: doctorPerf,
            financial: { total: financialSummary[0]?.total || 0, count: financialSummary[0]?.count || 0, avg: financialSummary[0]?.avg || 0, successRate, refunds: refundCount, failed: failedCount, byMethod, dailyRevenue },
            appointments: { total, completed, accepted, pending, cancelled, topSpecializations },
        });
    } catch (error) {
        console.error('Advanced report error:', error);
        sendServerError(res);
    }
};

// ── User Management ─────────────────────────────────────────────────────────

// @desc  Get all patients (with profile)
// @route GET /api/v1/admin/patients
const getAllPatients = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        const parsedPage = Number(page);
        const parsedLimit = Number(limit);
        const filter = { role: 'PATIENT' };
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'patientProfile.firstName': { $regex: search, $options: 'i' } },
                { 'patientProfile.lastName': { $regex: search, $options: 'i' } },
                { 'patientProfile.nic': { $regex: search, $options: 'i' } },
            ];
        }
        const total = await User.countDocuments(filter);
        const patients = await User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);
        res.json({ patients, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) });
    } catch (err) {
        sendServerError(res, err, true);
    }
};

// @desc  Get all admins
// @route GET /api/v1/admin/admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'ADMIN' }).select('-passwordHash').sort({ createdAt: -1 });
        res.json(admins);
    } catch (err) {
        sendServerError(res, err, true);
    }
};

// @desc  Create a new admin account
// @route POST /api/v1/admin/admins
const createAdmin = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
        if (String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });
        const admin = await User.create({
            email,
            passwordHash: password,
            role: 'ADMIN',
            patientProfile: { firstName: firstName || '', lastName: lastName || '' },
        });
        const { passwordHash: _, ...safe } = admin.toObject();
        res.status(201).json(safe);
    } catch (err) {
        sendServerError(res, err, true);
    }
};

// @desc  Update admin email / password / name
// @route PATCH /api/v1/admin/admins/:id
const updateAdmin = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const admin = await User.findOne({ _id: req.params.id, role: 'ADMIN' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        if (email && email !== admin.email) {
            const dup = await User.findOne({ email });
            if (dup) return res.status(400).json({ message: 'Email already in use' });
            admin.email = email;
        }
        if (password) {
            if (String(password).length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
            }
            admin.passwordHash = password; // pre-save hook will re-hash
        }
        if (firstName !== undefined) admin.patientProfile.firstName = firstName;
        if (lastName !== undefined) admin.patientProfile.lastName = lastName;
        await admin.save();
        const { passwordHash: _, ...safe } = admin.toObject();
        res.json(safe);
    } catch (err) {
        sendServerError(res, err, true);
    }
};

// @desc  Delete a user account (any role, guards against self-delete)
// @route DELETE /api/v1/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete your own account' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'DOCTOR') {
            await deleteDoctorAccountByUserId(user._id);
            return res.json({ message: 'Doctor account permanently deleted' });
        }
        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        sendServerError(res, err, true);
    }
};

// @desc  Toggle user isActive / doctor isActive
// @route PATCH /api/v1/admin/users/:id/toggle-active
const toggleUserActive = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'DOCTOR') {
            const doc = await Doctor.findOne({ userId: user._id });
            if (doc) { doc.isActive = !doc.isActive; await doc.save({ validateModifiedOnly: true }); }
            return res.json({ message: `Doctor ${doc?.isActive ? 'activated' : 'deactivated'}`, isActive: doc?.isActive });
        }
        // For non-doctor users we use a convention of storing active state in isActive (not in schema by default — graceful)
        user.isActive = !(user.isActive !== false); // toggle (default true if undefined)
        await user.save({ validateModifiedOnly: true });
        res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    } catch (err) {
        sendServerError(res, err, true);
    }
};


// ── Saved Reports (DB) ────────────────────────────────────────────────────────

// @desc  List all saved reports (sorted newest first)
// @route GET /api/v1/admin/saved-reports
const listSavedReports = async (req, res) => {
    try {
        const reports = await SavedReport.find()
            .populate('createdBy', 'email patientProfile')
            .sort({ createdAt: -1 })
            .lean();
        res.json(reports);
    } catch (error) {
        console.error('listSavedReports error:', error);
        sendServerError(res);
    }
};

// @desc  Save a new report
// @route POST /api/v1/admin/saved-reports
const createSavedReport = async (req, res) => {
    try {
        const { name, type, dateFrom, dateTo, sections, advSections, data } = req.body;
        if (!name || !type || !dateFrom || !dateTo) {
            return res.status(400).json({ message: 'name, type, dateFrom, dateTo are required' });
        }
        const report = await SavedReport.create({
            name, type, dateFrom, dateTo,
            sections: sections || {},
            advSections: advSections || {},
            data: data || {},
            createdBy: req.user._id,
        });
        res.status(201).json(report);
    } catch (error) {
        console.error('createSavedReport error:', error);
        sendServerError(res);
    }
};

// @desc  Update an existing saved report
// @route PUT /api/v1/admin/saved-reports/:id
const updateSavedReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        const { name, dateFrom, dateTo, sections, advSections, data } = req.body;
        if (name) report.name = name;
        if (dateFrom) report.dateFrom = dateFrom;
        if (dateTo) report.dateTo = dateTo;
        if (sections) report.sections = sections;
        if (advSections) report.advSections = advSections;
        if (data) report.data = data;
        await report.save();
        res.json(report);
    } catch (error) {
        console.error('updateSavedReport error:', error);
        sendServerError(res);
    }
};

// @desc  Delete a saved report
// @route DELETE /api/v1/admin/saved-reports/:id
const deleteSavedReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        await report.deleteOne();
        res.json({ message: 'Report deleted' });
    } catch (error) {
        console.error('deleteSavedReport error:', error);
        sendServerError(res);
    }
};

// —— Presets (Advanced report config library) ———————————————————————————————

// @desc  List all presets (newest/most recently used first)
// @route GET /api/v1/admin/presets
const listPresets = async (req, res) => {
    try {
        const presets = await Preset.find()
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();
        res.json(presets);
    } catch (error) {
        console.error('listPresets error:', error);
        sendServerError(res);
    }
};

// @desc  Create a new preset from advanced report configuration
// @route POST /api/v1/admin/presets
const createPreset = async (req, res) => {
    try {
        const { name, reportName, dateRange, sections, doctors, filters } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Preset name is required' });
        }

        const preset = await Preset.create({
            name: name.trim(),
            reportName: (reportName || '').trim(),
            dateRange: {
                from: dateRange?.from || '',
                to: dateRange?.to || '',
                preset: dateRange?.preset || '',
            },
            sections: Array.isArray(sections) ? sections : [],
            doctors: Array.isArray(doctors) ? doctors : [],
            filters: (filters && typeof filters === 'object' && !Array.isArray(filters)) ? filters : {},
            createdBy: req.user?._id || null,
        });

        res.status(201).json(preset);
    } catch (error) {
        console.error('createPreset error:', error);
        sendServerError(res);
    }
};

// @desc  Update a preset (rename/config update or touch as last used)
// @route PUT /api/v1/admin/presets/:id
const updatePreset = async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id);
        if (!preset) return res.status(404).json({ message: 'Preset not found' });

        const { name, reportName, dateRange, sections, doctors, filters, touch } = req.body;

        if (name !== undefined) {
            if (!String(name).trim()) return res.status(400).json({ message: 'Preset name cannot be empty' });
            preset.name = String(name).trim();
        }
        if (reportName !== undefined) preset.reportName = String(reportName || '').trim();
        if (dateRange !== undefined && dateRange && typeof dateRange === 'object' && !Array.isArray(dateRange)) {
            preset.dateRange = {
                from: dateRange.from || '',
                to: dateRange.to || '',
                preset: dateRange.preset || '',
            };
        }
        if (sections !== undefined) {
            if (!Array.isArray(sections)) return res.status(400).json({ message: 'sections must be an array' });
            preset.sections = sections;
        }
        if (doctors !== undefined) {
            if (!Array.isArray(doctors)) return res.status(400).json({ message: 'doctors must be an array' });
            preset.doctors = doctors;
        }
        if (filters !== undefined) {
            if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
                return res.status(400).json({ message: 'filters must be an object' });
            }
            preset.filters = filters;
        }

        if (touch === true) {
            preset.set('updatedAt', new Date());
        }

        await preset.save();
        res.json(preset);
    } catch (error) {
        console.error('updatePreset error:', error);
        sendServerError(res);
    }
};

// @desc  Delete a preset
// @route DELETE /api/v1/admin/presets/:id
const deletePreset = async (req, res) => {
    try {
        const preset = await Preset.findById(req.params.id);
        if (!preset) return res.status(404).json({ message: 'Preset not found' });
        await preset.deleteOne();
        res.json({ message: 'Preset deleted' });
    } catch (error) {
        console.error('deletePreset error:', error);
        sendServerError(res);
    }
};

module.exports = {
    getPendingDoctors,
    getAllDoctors,
    updateDoctorApprovalStatus,
    deleteDoctor,
    getAnalytics,
    getReportData,
    getAdvancedReportData,
    getAllPatients,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteUser,
    toggleUserActive,
    listSavedReports,
    createSavedReport,
    updateSavedReport,
    deleteSavedReport,
    listPresets,
    createPreset,
    updatePreset,
    deletePreset,
};
