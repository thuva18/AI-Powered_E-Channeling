const PatientJournal = require('../models/PatientJournal');

// ── Helpers ───────────────────────────────────────────────────────────────────

const success = (res, statusCode, message, data = null) => {
    const payload = { success: true, message };
    if (data !== null) payload.data = data;
    return res.status(statusCode).json(payload);
};

const failure = (res, statusCode, message) =>
    res.status(statusCode).json({ success: false, message });

// ── @desc    Create a new journal entry
// ── @route   POST /api/v1/patients/journals
// ── @access  Private/Patient
const createJournal = async (req, res) => {
    try {
        const {
            title,
            entryDate,
            symptoms,
            medications,
            moodStatus,
            painLevel,
            notes,
            visibility,
        } = req.body;

        // Required field validation
        if (!title || !title.trim()) {
            return failure(res, 400, 'Title is required');
        }
        if (!entryDate) {
            return failure(res, 400, 'Entry date is required');
        }

        // entryDate must not be in the future
        const parsedDate = new Date(entryDate);
        if (isNaN(parsedDate.getTime())) {
            return failure(res, 400, 'Invalid entry date format');
        }
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Allow today
        if (parsedDate > today) {
            return failure(res, 400, 'Entry date cannot be a future date');
        }

        // painLevel range validation
        if (painLevel !== undefined && painLevel !== null && painLevel !== '') {
            const level = Number(painLevel);
            if (isNaN(level) || level < 1 || level > 10) {
                return failure(res, 400, 'Pain level must be between 1 and 10');
            }
        }

        // moodStatus enum validation
        const validMoods = ['Improving', 'Stable', 'Worsening'];
        if (moodStatus && !validMoods.includes(moodStatus)) {
            return failure(res, 400, 'moodStatus must be Improving, Stable, or Worsening');
        }

        // visibility enum validation
        const validVisibility = ['PRIVATE', 'SHARED'];
        if (visibility && !validVisibility.includes(visibility)) {
            return failure(res, 400, 'Visibility must be PRIVATE or SHARED');
        }

        const journalData = {
            patientId: req.user._id,
            title: title.trim(),
            entryDate: parsedDate,
            symptoms: symptoms || '',
            medications: medications || '',
            moodStatus: moodStatus || 'Stable',
            notes: notes || '',
            visibility: visibility || 'PRIVATE',
        };

        // Only set painLevel if provided
        if (painLevel !== undefined && painLevel !== null && painLevel !== '') {
            journalData.painLevel = Number(painLevel);
        }

        const journal = await PatientJournal.create(journalData);

        return success(res, 201, 'Journal entry created successfully', journal);
    } catch (error) {
        console.error('createJournal error:', error.message);
        return failure(res, 500, 'Server error while creating journal entry');
    }
};

// ── @desc    Get all journal entries for the logged-in patient
// ── @route   GET /api/v1/patients/journals
// ── @access  Private/Patient
// ── Supports: ?search=, ?moodStatus=, ?entryDate=
const getMyJournals = async (req, res) => {
    try {
        const { search, moodStatus, entryDate } = req.query;

        // Build filter - always scope to the logged-in patient
        const filter = { patientId: req.user._id };

        // Filter by moodStatus
        const validMoods = ['Improving', 'Stable', 'Worsening'];
        if (moodStatus && validMoods.includes(moodStatus)) {
            filter.moodStatus = moodStatus;
        }

        // Filter by specific entryDate (match full day)
        if (entryDate) {
            const start = new Date(entryDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(entryDate);
            end.setHours(23, 59, 59, 999);
            filter.entryDate = { $gte: start, $lte: end };
        }

        // Search by title (case-insensitive)
        if (search && search.trim()) {
            filter.title = { $regex: search.trim(), $options: 'i' };
        }

        const journals = await PatientJournal.find(filter).sort({ entryDate: -1, createdAt: -1 });

        return success(res, 200, 'Journal entries fetched successfully', journals);
    } catch (error) {
        console.error('getMyJournals error:', error.message);
        return failure(res, 500, 'Server error while fetching journal entries');
    }
};

// ── @desc    Get a single journal entry by ID
// ── @route   GET /api/v1/patients/journals/:id
// ── @access  Private/Patient (owner only)
const getJournalById = async (req, res) => {
    try {
        const journal = await PatientJournal.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!journal) {
            return failure(res, 404, 'Journal entry not found');
        }

        return success(res, 200, 'Journal entry fetched successfully', journal);
    } catch (error) {
        console.error('getJournalById error:', error.message);
        return failure(res, 500, 'Server error while fetching journal entry');
    }
};

// ── @desc    Update a journal entry
// ── @route   PUT /api/v1/patients/journals/:id
// ── @access  Private/Patient (owner only)
const updateJournal = async (req, res) => {
    try {
        const journal = await PatientJournal.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!journal) {
            return failure(res, 404, 'Journal entry not found');
        }

        const {
            title,
            entryDate,
            symptoms,
            medications,
            moodStatus,
            painLevel,
            notes,
            visibility,
        } = req.body;

        // Validate title if provided
        if (title !== undefined && !title.trim()) {
            return failure(res, 400, 'Title cannot be empty');
        }

        // Validate entryDate if provided
        if (entryDate !== undefined) {
            const parsedDate = new Date(entryDate);
            if (isNaN(parsedDate.getTime())) {
                return failure(res, 400, 'Invalid entry date format');
            }
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (parsedDate > today) {
                return failure(res, 400, 'Entry date cannot be a future date');
            }
            journal.entryDate = parsedDate;
        }

        // Validate painLevel if provided
        if (painLevel !== undefined && painLevel !== null && painLevel !== '') {
            const level = Number(painLevel);
            if (isNaN(level) || level < 1 || level > 10) {
                return failure(res, 400, 'Pain level must be between 1 and 10');
            }
            journal.painLevel = level;
        }

        // Validate moodStatus if provided
        const validMoods = ['Improving', 'Stable', 'Worsening'];
        if (moodStatus !== undefined && !validMoods.includes(moodStatus)) {
            return failure(res, 400, 'moodStatus must be Improving, Stable, or Worsening');
        }

        // Validate visibility if provided
        const validVisibility = ['PRIVATE', 'SHARED'];
        if (visibility !== undefined && !validVisibility.includes(visibility)) {
            return failure(res, 400, 'Visibility must be PRIVATE or SHARED');
        }

        // Apply updates
        if (title !== undefined) journal.title = title.trim();
        if (symptoms !== undefined) journal.symptoms = symptoms;
        if (medications !== undefined) journal.medications = medications;
        if (moodStatus !== undefined) journal.moodStatus = moodStatus;
        if (notes !== undefined) journal.notes = notes;
        if (visibility !== undefined) journal.visibility = visibility;

        await journal.save();

        return success(res, 200, 'Journal entry updated successfully', journal);
    } catch (error) {
        console.error('updateJournal error:', error.message);
        return failure(res, 500, 'Server error while updating journal entry');
    }
};

// ── @desc    Delete a journal entry
// ── @route   DELETE /api/v1/patients/journals/:id
// ── @access  Private/Patient (owner only)
const deleteJournal = async (req, res) => {
    try {
        const result = await PatientJournal.deleteOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (result.deletedCount === 0) {
            return failure(res, 404, 'Journal entry not found');
        }

        return success(res, 200, 'Journal entry deleted successfully');
    } catch (error) {
        console.error('deleteJournal error:', error.message);
        return failure(res, 500, 'Server error while deleting journal entry');
    }
};

module.exports = {
    createJournal,
    getMyJournals,
    getJournalById,
    updateJournal,
    deleteJournal,
};
