const express = require('express');
const router = express.Router();
const {
    createJournal,
    getMyJournals,
    getJournalById,
    updateJournal,
    deleteJournal,
} = require('../controllers/patientJournalController');
const { protect, patientOnly } = require('../middlewares/authMiddleware');

// All routes require authentication and patient role
router.use(protect);
router.use(patientOnly);

// POST   /api/v1/patients/journals       → Create a new journal entry
// GET    /api/v1/patients/journals       → Get all journal entries (with optional filters)
router.route('/').post(createJournal).get(getMyJournals);

// GET    /api/v1/patients/journals/:id   → Get a single journal entry by ID
// PUT    /api/v1/patients/journals/:id   → Update a journal entry
// DELETE /api/v1/patients/journals/:id   → Delete a journal entry
router.route('/:id').get(getJournalById).put(updateJournal).delete(deleteJournal);

module.exports = router;
