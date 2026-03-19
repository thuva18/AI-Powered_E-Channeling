const mongoose = require('mongoose');

// Auto-generate receipt number: RCP-YYYY-NNNNN
const generateReceiptNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `RCP-${year}-${rand}`;
};

const transactionSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'LKR',
        },
        method: {
            type: String,
            enum: ['PAYHERE', 'BANK_TRANSFER', 'PAYPAL'],
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        // PayHere specific
        payhereOrderId: { type: String, default: '' },
        payherePaymentId: { type: String, default: '' },
        payhereStatusCode: { type: String, default: '' },
        payhereStatusMessage: { type: String, default: '' },
        // Dummy method reference (bank ref, paypal txn id, etc.)
        paymentReference: { type: String, default: '' },
        paymentNote: { type: String, default: '' },
        // Receipt
        receiptNumber: {
            type: String,
            default: generateReceiptNumber,
            unique: true,
        },
        // Admin actions
        adminNote: { type: String, default: '' },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Timestamps for payment events
        paidAt: { type: Date, default: null },
        approvedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
