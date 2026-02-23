const express = require('express');
const db = require('../../db');
const router = express.Router();

// Get Notifications
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const result = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Mark as Read
router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.userId;
        const notificationId = req.params.id;

        await db.query(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() 
             WHERE notification_id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Mark All Read
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.userId;
        await db.query(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() 
             WHERE user_id = $1`,
            [userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete Notification
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const notificationId = req.params.id;

        await db.query(
            `DELETE FROM notifications 
             WHERE notification_id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
