const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['DOCTOR', 'ADMIN', 'PATIENT'],
            required: true,
        },
        patientProfile: {
            firstName: { type: String, default: '' },
            lastName: { type: String, default: '' },
            phone: { type: String, default: '' },
            nic: { type: String, default: '' },
            dateOfBirth: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

// Pre-save hook to hash password before saving to the database
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('passwordHash')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
