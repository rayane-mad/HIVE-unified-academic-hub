const express = require('express');
const db = require('../../db');
const router = express.Router();

// Get User Profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch core user data
        const userRes = await db.query(
            'SELECT user_id, email, display_name, created_at FROM users WHERE user_id = $1',
            [userId]
        );

        if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const user = userRes.rows[0];

        // Fetch preferences
        const prefRes = await db.query(
            `SELECT preference_value FROM user_preferences 
             WHERE user_id = $1 AND preference_type = 'profile_info'`,
            [userId]
        );

        const prefs = prefRes.rows[0]?.preference_value || {};
        const major = prefs.major || 'Undeclared';
        const year = prefs.year || 'Student'; // Default to Student if not set
        const gpa = prefs.gpa || 'N/A';

        res.json({
            success: true,
            user: {
                ...user,
                major,
                year,
                gpa
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update Profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.userId;
        const { display_name, email, major, year, gpa } = req.body;

        // 1. Update Core User
        await db.query(
            'UPDATE users SET display_name = $1, email = $2 WHERE user_id = $3',
            [display_name, email, userId]
        );

        // 2. Update Preferences (Upsert)
        const prefCheck = await db.query(
            `SELECT preference_id FROM user_preferences 
             WHERE user_id = $1 AND preference_type = 'profile_info'`,
            [userId]
        );

        const newPrefs = JSON.stringify({ major, year, gpa });

        if (prefCheck.rows.length > 0) {
            // Update
            await db.query(
                `UPDATE user_preferences 
                 SET preference_value = $1
                 WHERE user_id = $2 AND preference_type = 'profile_info'`,
                [newPrefs, userId]
            );
        } else {
            // Insert
            await db.query(
                `INSERT INTO user_preferences (user_id, preference_type, preference_value)
                 VALUES ($1, 'profile_info', $2)`,
                [userId, newPrefs]
            );
        }

        res.json({ success: true, message: "Profile updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
