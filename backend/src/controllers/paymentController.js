const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// ── Helpers ────────────────────────────────────────────────────────────────────

// PayHere MD5 hash generation
const generatePayhereHash = (merchantId, orderId, amount, currency, merchantSecret) => {
    const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const raw = `${merchantId}${orderId}${amount.toFixed(2)}${currency}${secretHash}`;
    return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
};

const PAYMENT_METHODS = ['PAYHERE', 'BANK_TRANSFER', 'PAYPAL'];
const RECEIPT_ALLOWED_STATUSES = ['SUCCESS', 'APPROVED'];
const PAYHERE_FAILED_STATUS_CODES = ['-1', '-2', '-3'];

const transactionPopulateForMyTransactions = {
    path: 'appointmentId',
    select: 'appointmentDate timeSlot status consultationFeeCharged',
    populate: { path: 'doctorId', select: 'firstName lastName specialization' },
};

const transactionPopulateForPendingApprovals = {
    path: 'appointmentId',
    select: 'appointmentDate timeSlot consultationFeeCharged',
    populate: { path: 'doctorId', select: 'firstName lastName specialization' },
};

const sendServerError = (res, error, exposeMessage = false) =>
    res.status(500).json({ message: exposeMessage ? (error?.message || 'Server Error') : 'Server Error' });

const findPatientTransaction = (transactionId, patientId) =>
    Transaction.findOne({ _id: transactionId, patientId });

// ── 1. Initiate Payment ────────────────────────────────────────────────────────
// POST /api/v1/payments/initiate
// Body: { doctorId, appointmentDate, timeSlot, symptomDescription, symptoms, method }
const initiatePayment = async (req, res) => {
    const { doctorId, appointmentDate, timeSlot, symptomDescription, symptoms, symptomImages, method } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !method) {
        return res.status(400).json({ message: 'Doctor, date, time slot and payment method are required' });
    }

    if (!PAYMENT_METHODS.includes(method)) {
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor || doctor.approvalStatus !== 'APPROVED') {
            return res.status(404).json({ message: 'Doctor not found or not approved' });
        }

        // Check slot conflict
        const conflict = await Appointment.findOne({
            doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: { $in: ['PENDING', 'ACCEPTED'] },
        });
        if (conflict) {
            return res.status(400).json({ message: 'This time slot is already booked. Please choose another.' });
        }

        // Create Appointment in PENDING state, payment PENDING_PAYMENT
        const appointment = await Appointment.create({
            doctorId,
            patientId: req.user._id,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            symptomDescription: symptomDescription || '',
            symptoms: symptoms || [],
            symptomImages: symptomImages || [],
            consultationFeeCharged: doctor.consultationFee,
            status: 'PENDING',
            paymentStatus: 'PENDING_PAYMENT',
        });

        // Create Transaction record
        const transaction = await Transaction.create({
            appointmentId: appointment._id,
            patientId: req.user._id,
            amount: doctor.consultationFee,
            currency: 'LKR',
            method,
            status: 'PENDING',
        });

        // Link transaction to appointment
        appointment.paymentId = transaction._id;
        await appointment.save();

        // Build response
        const responseData = {
            transactionId: transaction._id,
            receiptNumber: transaction.receiptNumber,
            appointmentId: appointment._id,
            amount: transaction.amount,
            currency: 'LKR',
            method,
        };

        // PayHere-specific: generate hash for frontend
        if (method === 'PAYHERE') {
            const merchantId = process.env.PAYHERE_MERCHANT_ID || '1211149';
            const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'test_secret';
            const orderId = transaction._id.toString();
            const hash = generatePayhereHash(merchantId, orderId, transaction.amount, 'LKR', merchantSecret);

            // Fetch patient info for PayHere
            const patient = await User.findById(req.user._id).select('email patientProfile');
            const firstName = patient?.patientProfile?.firstName || 'Patient';
            const lastName = patient?.patientProfile?.lastName || '';
            const phone = patient?.patientProfile?.phone || '0771234567';
            const email = patient?.email || 'patient@example.com';

            responseData.payhere = {
                sandbox: process.env.NODE_ENV !== 'production',
                merchantId,
                orderId,
                amount: transaction.amount.toFixed(2),
                currency: 'LKR',
                hash,
                firstName,
                lastName,
                phone,
                email,
                itemName: `Consultation - Dr. ${doctor.firstName} ${doctor.lastName}`,
                returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/payments/return`,
                cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/payments/cancel`,
                notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/payments/payhere-notify`,
            };
        }

        res.status(201).json(responseData);
    } catch (error) {
        sendServerError(res, error, true);
    }
};

// ── 2. PayHere Notify (server-to-server webhook — public) ──────────────────────
// POST /api/v1/payments/payhere-notify
const payhereNotify = async (req, res) => {
    try {
        const {
            merchant_id, order_id, payment_id, payhere_amount,
            payhere_currency, status_code, md5sig,
        } = req.body;

        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'test_secret';
        const localMd5Hash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const expectedSig = crypto.createHash('md5')
            .update(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${localMd5Hash}`)
            .digest('hex').toUpperCase();

        if (md5sig !== expectedSig) {
            return res.status(400).send('Invalid signature');
        }

        const transaction = await Transaction.findById(order_id);
        if (!transaction) return res.status(404).send('Transaction not found');

        transaction.payhereOrderId = order_id;
        transaction.payherePaymentId = payment_id || '';
        transaction.payhereStatusCode = status_code;

        const appointment = await Appointment.findById(transaction.appointmentId);

        if (status_code === '2') {
            // SUCCESS — payment confirmed, but doctor still needs to approve
            transaction.status = 'SUCCESS';
            transaction.paidAt = new Date();
            if (appointment) {
                appointment.paymentStatus = 'PAID';
                // Keep status PENDING so the doctor can Accept/Reject
                await appointment.save();
            }
        } else if (PAYHERE_FAILED_STATUS_CODES.includes(status_code)) {
            // CANCELLED / FAILED / CHARGEDBACK
            transaction.status = 'FAILED';
            if (appointment) {
                appointment.paymentStatus = 'FAILED';
                appointment.status = 'CANCELLED';
                await appointment.save();
            }
        }

        await transaction.save();
        res.send('OK');
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// ── 3. Submit Dummy Payment Reference ─────────────────────────────────────────
// POST /api/v1/payments/:transactionId/dummy-submit
const submitDummyPayment = async (req, res) => {
    const { paymentReference, paymentNote } = req.body;

    try {
        const transaction = await findPatientTransaction(req.params.transactionId, req.user._id);

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.method === 'PAYHERE') {
            return res.status(400).json({ message: 'Use PayHere gateway for this payment method' });
        }
        if (transaction.status !== 'PENDING') {
            return res.status(400).json({ message: 'Transaction already processed' });
        }
        if (!paymentReference || !paymentReference.trim()) {
            return res.status(400).json({ message: 'Payment reference is required' });
        }

        transaction.paymentReference = paymentReference.trim();
        transaction.paymentNote = paymentNote || '';
        transaction.status = 'PENDING_APPROVAL';
        await transaction.save();

        // Appointment stays PENDING but paymentStatus = PENDING_APPROVAL
        await Appointment.findByIdAndUpdate(transaction.appointmentId, {
            paymentStatus: 'PENDING_APPROVAL',
        });

        res.json({
            message: 'Payment submitted for admin approval',
            transaction: {
                _id: transaction._id,
                status: transaction.status,
                receiptNumber: transaction.receiptNumber,
            },
        });
    } catch (error) {
        sendServerError(res, error, true);
    }
};

// ── 4. Get My Transactions (Patient) ──────────────────────────────────────────
// GET /api/v1/payments/my-transactions
const getMyTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ patientId: req.user._id })
            .populate(transactionPopulateForMyTransactions)
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        sendServerError(res);
    }
};

// ── 5. Get Receipt ─────────────────────────────────────────────────────────────
// GET /api/v1/payments/:transactionId/receipt
const getReceipt = async (req, res) => {
    try {
        const transaction = await findPatientTransaction(req.params.transactionId, req.user._id).populate({
            path: 'appointmentId',
            populate: { path: 'doctorId', select: 'firstName lastName specialization consultationFee' },
        });

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (!RECEIPT_ALLOWED_STATUSES.includes(transaction.status)) {
            return res.status(403).json({ message: 'Receipt not available for this transaction' });
        }

        const patient = await User.findById(req.user._id).select('email patientProfile');
        const apt = transaction.appointmentId;
        const doctor = apt?.doctorId;

        res.json({
            receiptNumber: transaction.receiptNumber,
            issuedAt: transaction.paidAt || transaction.approvedAt || transaction.updatedAt,
            patient: {
                name: `${patient?.patientProfile?.firstName || ''} ${patient?.patientProfile?.lastName || ''}`.trim(),
                email: patient?.email,
                nic: patient?.patientProfile?.nic,
                phone: patient?.patientProfile?.phone,
            },
            doctor: {
                name: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'N/A',
                specialization: doctor?.specialization,
            },
            appointment: {
                date: apt?.appointmentDate,
                timeSlot: apt?.timeSlot,
                status: apt?.status,
            },
            payment: {
                amount: transaction.amount,
                currency: transaction.currency,
                method: transaction.method,
                status: transaction.status,
                reference: transaction.paymentReference,
                payherePaymentId: transaction.payherePaymentId,
            },
        });
    } catch (error) {
        sendServerError(res);
    }
};

// ── 6. Admin: Get All Transactions ─────────────────────────────────────────────
// GET /api/v1/payments/admin/all
const adminGetAllTransactions = async (req, res) => {
    try {
        const { status, method } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (method) filter.method = method;

        const transactions = await Transaction.find(filter)
            .populate('patientId', 'email patientProfile')
            .populate(transactionPopulateForMyTransactions)
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        sendServerError(res);
    }
};

// ── 7. Admin: Approve Dummy Payment ───────────────────────────────────────────
// PATCH /api/v1/payments/admin/:transactionId/approve
const adminApproveTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ message: 'Transaction is not pending approval' });
        }

        transaction.status = 'APPROVED';
        transaction.approvedBy = req.user._id;
        transaction.approvedAt = new Date();
        transaction.paidAt = new Date();
        await transaction.save();

        // Payment approved by admin — appointment payment confirmed, but doctor still approves clinically
        await Appointment.findByIdAndUpdate(transaction.appointmentId, {
            paymentStatus: 'PAID',
            // Keep status PENDING so the doctor can Accept/Reject
        });

        res.json({ message: 'Transaction approved successfully', transaction });
    } catch (error) {
        sendServerError(res, error, true);
    }
};

// ── 8. Admin: Reject Dummy Payment ────────────────────────────────────────────
// PATCH /api/v1/payments/admin/:transactionId/reject
const adminRejectTransaction = async (req, res) => {
    try {
        const { adminNote } = req.body;
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        if (transaction.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ message: 'Transaction is not pending approval' });
        }

        transaction.status = 'REJECTED';
        transaction.adminNote = adminNote || '';
        await transaction.save();

        await Appointment.findByIdAndUpdate(transaction.appointmentId, {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
        });

        res.json({ message: 'Transaction rejected', transaction });
    } catch (error) {
        sendServerError(res, error, true);
    }
};

// ── 9. Admin: Get Pending Approvals ───────────────────────────────────────────
// GET /api/v1/payments/admin/pending
const adminGetPendingTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ status: 'PENDING_APPROVAL' })
            .populate('patientId', 'email patientProfile')
            .populate(transactionPopulateForPendingApprovals)
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        sendServerError(res);
    }
};

// ── 10. Verify PayHere payment status (called by frontend after return) ────────
// GET /api/v1/payments/:transactionId/status
const getTransactionStatus = async (req, res) => {
    try {
        const transaction = await findPatientTransaction(req.params.transactionId, req.user._id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        // MOCK PAYHERE SUCCESS FOR LOCALHOST (Since Webhook cannot reach localhost)
        if (process.env.NODE_ENV !== 'production' && transaction.method === 'PAYHERE' && transaction.status === 'PENDING') {
            transaction.status = 'SUCCESS';
            transaction.paidAt = new Date();
            await transaction.save();

            const appointment = await Appointment.findById(transaction.appointmentId);
            if (appointment) {
                appointment.paymentStatus = 'PAID';
                await appointment.save();
            }
        }

        res.json({
            _id: transaction._id,
            status: transaction.status,
            method: transaction.method,
            receiptNumber: transaction.receiptNumber,
            amount: transaction.amount,
            paidAt: transaction.paidAt,
        });
    } catch (error) {
        sendServerError(res);
    }
};

module.exports = {
    initiatePayment,
    payhereNotify,
    submitDummyPayment,
    getMyTransactions,
    getReceipt,
    adminGetAllTransactions,
    adminApproveTransaction,
    adminRejectTransaction,
    adminGetPendingTransactions,
    getTransactionStatus,
};
