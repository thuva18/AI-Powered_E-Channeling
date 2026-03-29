const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
            index: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Allow null for older unlinked records or external walk-ins
        },
        patientName: {
            type: String,
            required: true,
            trim: true,
        },
        patientAge: {
            type: Number,
        },
        patientGender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
        },
        contactNumber: {
            type: String,
            default: '',
        },
        visitDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        diagnosis: {
            type: String,
            required: true,
        },
        prescription: [
            {
                medication: { type: String, required: true },
                dosage: { type: String },
                frequency: { type: String },
                duration: { type: String },
            },
        ],
        notes: {
            type: String,
            default: '',
        },
        followUpDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['Active', 'Recovered', 'Follow-up', 'Referred', 'Chronic'],
            default: 'Active',
        },
    },
    { timestamps: true }
);

const Journal = mongoose.model('Journal', journalSchema);
module.exports = Journal;
