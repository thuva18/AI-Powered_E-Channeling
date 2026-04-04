const mongoose = require('mongoose');

const savedReportSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['standard', 'advanced'],
            required: true,
        },
        dateFrom: { type: String, required: true },   // ISO date string YYYY-MM-DD
        dateTo: { type: String, required: true },

        // Standard report: which sections were included
        sections: {
            appointmentSummary: { type: Boolean, default: true },
            doctorRevenue: { type: Boolean, default: true },
            paymentDetails: { type: Boolean, default: true },
        },

        // Advanced report: which sections were selected
        advSections: {
            appointmentSummary: { type: Boolean, default: false },
            doctorPerformance: { type: Boolean, default: false },
            cancellationAnalysis: { type: Boolean, default: false },
            financialSummary: { type: Boolean, default: false },
            peakHours: { type: Boolean, default: false },
        },

        // Snapshot of the data at the time of saving (flexible JSON)
        data: { type: mongoose.Schema.Types.Mixed, default: {} },

        // Who created it
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

const SavedReport = mongoose.model('SavedReport', savedReportSchema);
module.exports = SavedReport;
