const Notification = require('../models/Notification');

/**
 * Creates a notification for a user
 * @param {string} userId - ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} type - 'info', 'success', 'warning', 'error'
 * @param {string} link - Optional URL/route to navigate to
 */
const createNotification = async (userId, title, message, type = 'info', link = '') => {
    try {
        const notification = new Notification({
            userId,
            title,
            message,
            type,
            link
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    createNotification
};
