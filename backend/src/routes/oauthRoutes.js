const express = require('express');
const db = require('../../db');
const router = express.Router();

// ==========================================
// REAL OAUTH ROUTES (Google & Outlook)
// ==========================================

// --- GOOGLE ---

// 1. Redirect to Google
router.get('/auth/google', (req, res) => {
    const { userId } = req.query; // Pass userId to state so we know who to link

    if (!userId) {
        return res.status(400).json({ error: "Missing userId in query" });
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' '),
        state: userId // Encoded state
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
});

// 2. Google Callback
router.get('/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = state; // We passed userId as state

    if (!code || !userId) {
        return res.status(400).send("Invalid callback data. Missing code or state/userId.");
    }

    try {
        const axios = require('axios');

        // Exchange code for tokens
        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const values = {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        };

        const tokenRes = await axios.post(tokenUrl, new URLSearchParams(values), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token } = tokenRes.data;

        console.log(`✅ Google OAuth Validated for User ${userId}`);

        // Store in DB
        await db.query(
            `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'google', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
            [userId, access_token]
        );

        // Redirect to frontend success page (or settings)
        const frontendUrl = 'http://localhost:5173/settings';
        res.redirect(frontendUrl);

    } catch (error) {
        console.error("❌ Google OAuth Error:", error.response?.data || error.message);
        res.status(500).send("Authentication failed");
    }
});

// --- OUTLOOK ---

// 1. Redirect to Outlook (Microsoft)
router.get('/auth/outlook', (req, res) => {
    const { userId } = req.query;

    console.log("🔍 CHECKING ENV VARS:");
    console.log("👉 OUTLOOK_CLIENT_ID:", process.env.OUTLOOK_CLIENT_ID);
    console.log("👉 OUTLOOK_REDIRECT_URI:", process.env.OUTLOOK_REDIRECT_URI);

    if (!userId) {
        return res.status(400).json({ error: "Missing userId in query" });
    }

    const rootUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
    const options = {
        client_id: process.env.OUTLOOK_CLIENT_ID,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
        response_type: 'code',
        scope: 'offline_access User.Read Calendars.Read',
        state: userId,
        response_mode: 'query'
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
});

// 2. Outlook Callback
router.get('/auth/outlook/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = state;

    if (!code || !userId) {
        return res.status(400).send("Invalid callback data. Missing code or state/userId.");
    }

    try {
        const axios = require('axios');
        const qs = require('qs'); // Axios needs qs for application/x-www-form-urlencoded

        // Exchange code for tokens
        const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

        const values = {
            client_id: process.env.OUTLOOK_CLIENT_ID,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET,
            redirect_uri: process.env.OUTLOOK_REDIRECT_URI,
            grant_type: 'authorization_code',
            code: code,
        };

        const tokenRes = await axios.post(tokenUrl, qs.stringify(values), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token } = tokenRes.data;

        console.log(`✅ Outlook OAuth Validated for User ${userId}`);

        // Store in DB
        await db.query(
            `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'outlook', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
            [userId, access_token]
        );

        // Redirect to frontend
        const frontendUrl = 'http://localhost:5173/settings';
        res.redirect(frontendUrl);

    } catch (error) {
        console.error("❌ Outlook OAuth Error:", error.response?.data || error.message);
        res.status(500).send("Authentication failed: " + (error.response?.data?.error_description || error.message));
    }
});

// Debug endpoint to see raw Google data
router.get('/debug/google', async (req, res) => {
    try {
        const axios = require('axios');
        const { userId } = req.query;

        if (!userId) return res.status(400).json({ error: "No userId provided" });

        // 1. Get Token
        const dbRes = await db.query(
            "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'google'",
            [userId]
        );
        const token = dbRes.rows[0]?.access_token;

        if (!token) return res.status(404).json({ error: "No Google token found for user" });

        // 2. Validate Token Info
        let tokenInfo = {};
        try {
            const infoRes = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
            tokenInfo = infoRes.data;
        } catch (e) {
            tokenInfo = { error: e.message, details: e.response?.data };
        }

        // 3. Fetch Events
        const eventsRes = await axios.get(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    timeMin: new Date().toISOString(),
                    maxResults: 5,
                    singleEvents: true,
                    orderBy: 'startTime'
                }
            }
        );

        res.json({
            success: true,
            user_id: userId,
            token_preview: token.substring(0, 10) + '...',
            token_info: tokenInfo,
            events_found: eventsRes.data.items.length,
            first_event: eventsRes.data.items[0] || null,
            raw_data: eventsRes.data
        });

    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            full_error: error.response?.data
        });
    }
});

module.exports = router;
