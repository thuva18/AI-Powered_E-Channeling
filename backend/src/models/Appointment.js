const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        timeSlot: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
            default: 'PENDING',
        },
        paymentStatus: {
            type: String,
            enum: ['PAID', 'UNPAID'],
            default: 'UNPAID',
        },
        symptoms: {
            type: [String],
            default: [],
        },
        symptomDescription: {
            type: String,
            default: '',
        },
        symptomImages: {
            type: [String], // stored filenames / URLs
            default: [],
        },
        notes: {
            type: String,
            default: '',
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        consultationFeeCharged: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;

