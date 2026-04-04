const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const OPEN_APPOINTMENT_STATUSES = ['PENDING', 'ACCEPTED'];

const deleteDoctorAccountByUserId = async (userId) => {
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return null;

    // Cancel any still-open appointments so patients do not keep an active booking
    // against a deleted doctor account.
    await Appointment.updateMany(
        { doctorId: doctor._id, status: { $in: OPEN_APPOINTMENT_STATUSES } },
        { $set: { status: 'CANCELLED' } }
    );

    await Doctor.findByIdAndDelete(doctor._id);
    await User.findByIdAndDelete(userId);

    return doctor;
};

module.exports = {
    deleteDoctorAccountByUserId,
};
