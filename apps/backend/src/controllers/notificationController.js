const Notification = require('../models/Notification');

// Get all notifications for the logged in user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 }); // Newest first
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error marking all as read' });
    }
};

// Delete a single notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id, userId: req.user._id
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user._id });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error clearing notifications' });
    }
};
