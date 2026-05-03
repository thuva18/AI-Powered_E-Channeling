const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
