const Journal = require('../models/Journal');
const Doctor = require('../models/Doctor');

const findDoctorByUserId = (userId) => Doctor.findOne({ userId });
const sendServerError = (res, error, includeDetail = false) => {
    if (error?.name === 'ValidationError' || error?.name === 'CastError') {
        const firstValidationError = Object.values(error.errors || {})[0];
        const message = firstValidationError?.message || error.message || 'Validation failed';
        return res.status(400).json({ message });
    }

    return res.status(500).json(includeDetail ? { message: 'Server error', error: error.message } : { message: 'Server error' });
};
const trimValue = (value) => typeof value === 'string' ? value.trim() : value;
const normalizePrescription = (prescription = []) => {
    if (!Array.isArray(prescription)) return [];

    return prescription
        .map((item = {}) => ({
            medication: trimValue(item.medication) || '',
            dosage: trimValue(item.dosage) || '',
            frequency: trimValue(item.frequency) || '',
            duration: trimValue(item.duration) || '',
        }))
        .filter((item) => item.medication || item.dosage || item.frequency || item.duration);
};
const getPrescriptionError = (prescription = []) => {
    const invalidRow = prescription.find((item) => !item.medication);
    return invalidRow ? 'Medication name is required for each prescription row.' : null;
};
const normalizeJournalPayload = (payload = {}) => {
    const normalized = {};

    if ('patientId' in payload) normalized.patientId = payload.patientId || null;
    if ('patientName' in payload) normalized.patientName = trimValue(payload.patientName);
    if ('patientAge' in payload) normalized.patientAge = payload.patientAge === '' || payload.patientAge === null || payload.patientAge === undefined
        ? null
        : Number(payload.patientAge);
    if ('patientGender' in payload) normalized.patientGender = payload.patientGender || null;
    if ('contactNumber' in payload) normalized.contactNumber = trimValue(payload.contactNumber) || '';
    if ('visitDate' in payload) normalized.visitDate = payload.visitDate;
    if ('diagnosis' in payload) normalized.diagnosis = trimValue(payload.diagnosis);
    if ('prescription' in payload) normalized.prescription = normalizePrescription(payload.prescription);
    if ('notes' in payload) normalized.notes = trimValue(payload.notes) || '';
    if ('followUpDate' in payload) normalized.followUpDate = payload.followUpDate || null;
    if ('status' in payload) normalized.status = payload.status;

    return normalized;
};

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

        const payload = normalizeJournalPayload(req.body);
        const prescriptionError = getPrescriptionError(payload.prescription);
        if (prescriptionError) return res.status(400).json({ message: prescriptionError });

        const entry = await Journal.create({
            doctorId: doctor._id,
            ...payload,
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
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const entry = await Journal.findOne({ _id: req.params.id, doctorId: doctor._id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        const updates = normalizeJournalPayload(req.body);
        const prescriptionError = getPrescriptionError(updates.prescription);
        if (prescriptionError) return res.status(400).json({ message: prescriptionError });

        Object.assign(entry, updates);
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
