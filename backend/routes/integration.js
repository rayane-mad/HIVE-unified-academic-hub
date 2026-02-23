const express = require('express');
const axios = require('axios');
const db = require('../db');
const router = express.Router();
require('dotenv').config();

// Import Services to fetch data
const canvasService = require('../services/canvasService');
const outlookService = require('../services/outlookService');
const googleService = require('../services/googleService');

// The Python AI Engine URL
const AI_SERVICE_URL = 'http://127.0.0.1:5001/predict-priority';

// ==========================================
// 1. GET FEED (The Missing Piece!)
// ==========================================
router.get('/feed', async (req, res) => {
    try {
        console.log("📡 Fetching data for feed...");

        // A. Fetch data from all services
        // Note: For this MVP, canvasService uses the token in .env
        const canvasAssignments = await canvasService.getAssignments(req.userId);
        const outlookEvents = await outlookService.getEvents(req.userId);
        const googleEvents = await googleService.getEvents(req.userId);

        // B. Combine into one list
        let allItems = [
            ...canvasAssignments,
            ...outlookEvents,
            ...googleEvents
        ];

        // C. Send to Python AI for Prioritization
        console.log("🧠 Sending items to AI Engine...");
        
        allItems = await Promise.all(allItems.map(async (item) => {
            const targetDate = item.due_date || item.start_time;
            
            // If no date, default to Low priority
            if (!targetDate) return { ...item, priority: 'Low' };

            try {
                // Call Python API
                const aiResponse = await axios.post(AI_SERVICE_URL, {
                    due_date: targetDate
                });
                return { ...item, priority: aiResponse.data.priority };
            } catch (aiError) {
                console.warn(`⚠️ AI unavailable for item ${item.id}, defaulting to Medium.`);
                return { ...item, priority: 'Medium' };
            }
        }));

        // D. Sort by Date (Soonest first)
        allItems.sort((a, b) => {
            const dateA = new Date(a.due_date || a.start_time || '9999-12-31');
            const dateB = new Date(b.due_date || b.start_time || '9999-12-31');
            return dateA - dateB;
        });

        res.json({
            success: true,
            count: allItems.length,
            data: allItems
        });

    } catch (err) {
        console.error("❌ Feed Error:", err.message);
        res.status(500).json({ error: "Failed to load feed", details: err.message });
    }
});

// ==========================================
// 2. LINKING ACCOUNTS (Your existing logic)
// ==========================================

// Manual Link
router.post('/link-canvas', async (req, res) => {
    const { userId, canvasToken } = req.body;

    if (!userId || !canvasToken) return res.status(400).json({ error: "Missing info" });

    try {
        await db.query(
            `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'canvas', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
            [userId, canvasToken]
        );
        res.json({ success: true, message: "Manual link successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// OAuth Link - Step 1
router.get('/connect/canvas', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.CANVAS_CLIENT_ID || 'mock_client_id',
        response_type: 'code',
        redirect_uri: process.env.CANVAS_REDIRECT_URI || 'http://localhost:3000/api/integration/canvas/callback',
        state: 'secure_random_string',
        scope: 'url:GET|/api/v1/planner/items'
    });
    
    res.redirect(`${process.env.CANVAS_BASE_URL}/login/oauth2/auth?${params}`);
});

// OAuth Link - Step 2
router.get('/canvas/callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) return res.status(400).send("Authorization failed.");

    try {
        // Exchange code for token
        await axios.post(`${process.env.CANVAS_BASE_URL}/login/oauth2/token`, {}, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.CANVAS_CLIENT_ID,
                client_secret: process.env.CANVAS_CLIENT_SECRET,
                redirect_uri: process.env.CANVAS_REDIRECT_URI,
                code: code
            }
        });

        res.redirect('http://localhost:5173/dashboard?status=oauth_success');

    } catch (err) {
        console.error("OAuth Error:", err.message);
        res.redirect('http://localhost:5173/settings?error=oauth_config_missing');
    }
});

module.exports = router;