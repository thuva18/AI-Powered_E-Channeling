const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get all pending doctor registrations
// @route   GET /api/v1/admin/doctors/pending
// @access  Private/Admin
const getPendingDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ approvalStatus: 'PENDING' }).populate('userId', 'email');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
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
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve or reject doctor registration
// @route   PATCH /api/v1/admin/doctors/:id/approve
// @access  Private/Admin
const updateDoctorApprovalStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
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
        res.status(500).json({ message: error.message || 'Server Error' });
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

        await User.findByIdAndDelete(doctor.userId);
        await Doctor.findByIdAndDelete(doctor._id);

        res.json({ message: 'Doctor account permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPendingDoctors,
    getAllDoctors,
    updateDoctorApprovalStatus,
    deleteDoctor,
};
