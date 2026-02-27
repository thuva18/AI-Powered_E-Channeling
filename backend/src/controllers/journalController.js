const Journal = require('../models/Journal');
const Doctor = require('../models/Doctor');

// @desc  Get all journal entries for logged-in doctor
// @route GET /api/v1/doctors/journal
const getJournals = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        const entries = await Journal.find({ doctorId: doctor._id }).sort({ visitDate: -1 });
        res.json(entries);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Create a new journal entry
// @route POST /api/v1/doctors/journal
const createJournal = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        const entry = await Journal.create({ doctorId: doctor._id, ...req.body });
        res.status(201).json(entry);
    } catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};

// @desc  Update a journal entry
// @route PUT /api/v1/doctors/journal/:id
const updateJournal = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const entry = await Journal.findOne({ _id: req.params.id, doctorId: doctor._id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        Object.assign(entry, req.body);
        await entry.save();
        res.json(entry);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc  Delete a journal entry
// @route DELETE /api/v1/doctors/journal/:id
const deleteJournal = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const result = await Journal.deleteOne({ _id: req.params.id, doctorId: doctor._id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getJournals, createJournal, updateJournal, deleteJournal };
