const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    payhereNotify,
    submitDummyPayment,
    getMyTransactions,
    getReceipt,
    adminGetAllTransactions,
    adminApproveTransaction,
    adminRejectTransaction,
    adminGetPendingTransactions,
    getTransactionStatus,
} = require('../controllers/paymentController');
const { protect, patientOnly, adminOnly } = require('../middlewares/authMiddleware');

// ── Public (no auth) ──────────────────────────────────────────────────────────
// PayHere server-to-server notification
router.post('/payhere-notify', payhereNotify);

// ── Patient routes ────────────────────────────────────────────────────────────
router.post('/initiate', protect, patientOnly, initiatePayment);
router.post('/:transactionId/dummy-submit', protect, patientOnly, submitDummyPayment);
router.get('/my-transactions', protect, patientOnly, getMyTransactions);
router.get('/:transactionId/receipt', protect, patientOnly, getReceipt);
router.get('/:transactionId/status', protect, patientOnly, getTransactionStatus);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, adminGetAllTransactions);
router.get('/admin/pending', protect, adminOnly, adminGetPendingTransactions);
router.patch('/admin/:transactionId/approve', protect, adminOnly, adminApproveTransaction);
router.patch('/admin/:transactionId/reject', protect, adminOnly, adminRejectTransaction);

module.exports = router;
