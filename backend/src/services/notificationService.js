const db = require('../../db');

/**
 * Create notifications for new assignments/events
 * Checks if notification already exists before creating
 */
async function createNotificationsForItems(userId, items) {
    const notifications = [];

    for (const item of items) {
        try {
            // Decide if this item should trigger a notification
            const shouldNotify = shouldCreateNotification(item);

            if (!shouldNotify) continue;

            // Check if notification already exists for this item
            const existingCheck = await db.query(
                `SELECT notification_id FROM notifications 
         WHERE user_id = $1 AND reference_id = $2`,
                [userId, item.id]
            );

            if (existingCheck.rows.length > 0) {
                // Notification already exists, skip
                continue;
            }

            // Create notification (removed 'course' column since it doesn't exist in DB)
            const notificationType = getNotificationType(item);
            const notificationTitle = getNotificationTitle(item);
            const notificationContent = getNotificationContent(item);

            const result = await db.query(
                `INSERT INTO notifications 
         (user_id, type, title, content, reference_id, created_at, is_read)
         VALUES ($1, $2, $3, $4, $5, NOW(), FALSE)
         RETURNING notification_id`,
                [
                    userId,
                    notificationType,
                    notificationTitle,
                    notificationContent,
                    item.id
                ]
            );

            notifications.push(result.rows[0]);
            console.log(`📬 Created notification for: ${item.title}`);
        } catch (err) {
            console.error(`Failed to create notification for ${item.id}:`, err.message);
            // Continue processing other items
        }
    }

    return notifications;
}

/**
 * Determine if an item should trigger a notification
 */
function shouldCreateNotification(item) {
    // Only notify for assignments and events
    if (item.type !== 'assignment' && item.type !== 'event') {
        return false;
    }

    const targetDate = item.due_date || item.start_time;
    if (!targetDate) return false;

    const now = new Date();
    const itemDate = new Date(targetDate);
    const hoursDiff = (itemDate - now) / (1000 * 60 * 60); // Hours until due
    const daysDiff = Math.floor(hoursDiff / 24);

    // URGENT: Notify for High priority items (less than 24 hours)
    if (hoursDiff > 0 && hoursDiff <= 24 && item.priority === 'High') {
        return true; // Always notify for urgent high-priority items
    }

    // Notify for items due/starting within the next 7 days
    // But not items that are already past
    return daysDiff >= 0 && daysDiff <= 7;
}

/**
 * Get notification type from item type
 */
function getNotificationType(item) {
    if (item.type === 'assignment') return 'assignment';
    if (item.type === 'event') return 'event';
    if (item.type === 'announcement') return 'announcement';
    return 'assignment'; // default
}

/**
 * Generate notification title
 */
function getNotificationTitle(item) {
    // URGENT for High priority items (less than 24 hours)
    const targetDate = item.due_date || item.start_time;
    if (targetDate) {
        const now = new Date();
        const itemDate = new Date(targetDate);
        const hoursDiff = (itemDate - now) / (1000 * 60 * 60);

        if (hoursDiff > 0 && hoursDiff <= 24 && item.priority === 'High') {
            if (item.type === 'assignment') {
                return `🚨 URGENT: ${item.title} - Due in ${Math.floor(hoursDiff)} hours!`;
            } else if (item.type === 'event') {
                return `🚨 URGENT: ${item.title} - Starts in ${Math.floor(hoursDiff)} hours!`;
            }
        }
    }

    // Regular notifications
    if (item.type === 'assignment') {
        return `📝 New Assignment: ${item.title}`;
    } else if (item.type === 'event') {
        return `📅 Upcoming Event: ${item.title}`;
    }
    return item.title;
}

/**
 * Generate notification content
 */
function getNotificationContent(item) {
    const targetDate = item.due_date || item.start_time;
    if (!targetDate) return item.description || 'No details provided';

    const itemDate = new Date(targetDate);
    const now = new Date();
    const hoursDiff = (itemDate - now) / (1000 * 60 * 60);
    const daysDiff = Math.floor(hoursDiff / 24);

    let timePhrase = '';

    // URGENT messaging for High priority (less than 24 hours)
    if (hoursDiff > 0 && hoursDiff <= 24 && item.priority === 'High') {
        const hours = Math.floor(hoursDiff);
        const minutes = Math.floor((hoursDiff - hours) * 60);
        timePhrase = `⚠️ ONLY ${hours}h ${minutes}m remaining! Act now!`;
    } else if (daysDiff === 0) {
        timePhrase = 'Due today';
    } else if (daysDiff === 1) {
        timePhrase = 'Due tomorrow';
    } else if (daysDiff <= 7) {
        timePhrase = `Due in ${daysDiff} days`;
    } else {
        timePhrase = `Due ${itemDate.toLocaleDateString()}`;
    }

    return `${timePhrase}${item.course ? ` • ${item.course}` : ''}`;
}

module.exports = {
    createNotificationsForItems
};
