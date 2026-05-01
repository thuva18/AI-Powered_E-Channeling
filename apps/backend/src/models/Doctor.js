const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        slmcNumber: {
            type: String,
            required: true,
            unique: true,
        },
        nic: {
            type: String,
            required: [true, 'NIC number is required'],
            unique: true,
            trim: true,
            uppercase: true, // normalise 'v' → 'V'
            validate: {
                validator: (v) => /^(\d{9}[Vv]|\d{12})$/.test(v),
                message: 'NIC must be 9 digits + V (e.g. 912345678V) or 12 digits (e.g. 200012345678)',
            },
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            validate: {
                validator: (v) => /^(07\d{8}|\+94\d{9})$/.test(v),
                message: 'Phone number must be in the format 07XXXXXXXX or +94XXXXXXXXX',
            },
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Gender is required'],
        },
        specialization: {
            type: String,
            required: true,
        },
        approvalStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
        },
        consultationFee: {
            type: Number,
            default: 0,
        },
        availability: [
            {
                day: {
                    type: String,
                    enum: [
                        'MONDAY',
                        'TUESDAY',
                        'WEDNESDAY',
                        'THURSDAY',
                        'FRIDAY',
                        'SATURDAY',
                        'SUNDAY',
                    ],
                },
                startTime: String, // HH:mm format
                endTime: String, // HH:mm format
                maxSlots: Number,
            },
        ],
        profileDetails: {
            bio: { type: String, default: '' },
            qualifications: [{ type: String }],
            experienceYears: { type: Number, default: 0 },
            contactNumber: { type: String, default: '' },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
