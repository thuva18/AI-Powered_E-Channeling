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
            ref: 'User', // Assuming patient is also a User
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        timeSlot: {
            type: String, // Format: 'HH:mm - HH:mm'
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
        notes: {
            type: String,
            default: '',
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
