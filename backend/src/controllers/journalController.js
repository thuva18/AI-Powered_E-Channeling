const Journal = require('../models/Journal');
const Doctor = require('../models/Doctor');

const findDoctorByUserId = (userId) => Doctor.findOne({ userId });
const sendServerError = (res, error, includeDetail = false) =>
    res.status(500).json(includeDetail ? { message: 'Server error', error: error.message } : { message: 'Server error' });

// @desc  Get all journal entries for logged-in doctor
// @route GET /api/v1/doctors/journal
const getJournals = async (req, res) => {
    try {
        const doctor = await findDoctorByUserId(req.user._id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        const entries = await Journal.find({ doctorId: doctor._id }).sort({ visitDate: -1 });
        res.json(entries);
    } catch (e) {
        sendServerError(res);
    }
};

// @desc  Create a new journal entry
// @route POST /api/v1/doctors/journal
const createJournal = async (req, res) => {
    try {
        const doctor = await findDoctorByUserId(req.user._id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Destructure patientId if provided to explicitly handle it
        const { patientId, ...rest } = req.body;
        const entry = await Journal.create({
            doctorId: doctor._id,
            patientId: patientId || null,
            ...rest
        });

        res.status(201).json(entry);
    } catch (e) {
        sendServerError(res, e, true);
    }
};

// @desc  Update a journal entry
// @route PUT /api/v1/doctors/journal/:id
const updateJournal = async (req, res) => {
    try {
        const doctor = await findDoctorByUserId(req.user._id);
        const entry = await Journal.findOne({ _id: req.params.id, doctorId: doctor._id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        Object.assign(entry, req.body);
        await entry.save();
        res.json(entry);
    } catch (e) {
        sendServerError(res);
    }
};

// @desc  Delete a journal entry
// @route DELETE /api/v1/doctors/journal/:id
const deleteJournal = async (req, res) => {
    try {
        const doctor = await findDoctorByUserId(req.user._id);
        const result = await Journal.deleteOne({ _id: req.params.id, doctorId: doctor._id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted' });
    } catch (e) {
        sendServerError(res);
    }
};

module.exports = { getJournals, createJournal, updateJournal, deleteJournal };
