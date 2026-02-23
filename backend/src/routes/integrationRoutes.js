const express = require('express');
const db = require('../../db'); // Import DB

const canvasService = require('../services/canvasService');
const outlookService = require('../services/outlookService');
const googleService = require('../services/googleService');
const { createNotificationsForItems } = require('../services/notificationService');

const router = express.Router();

// Main feed endpoint - REAL DATA
router.get('/feed', async (req, res) => {
  try {
    console.log("📡 Fetching REAL Canvas data for feed...");

    // Fetch from all sources in parallel
    const results = await Promise.allSettled([
      canvasService.getAssignments(req.userId),
      outlookService.getEvents(req.userId),
      googleService.getEvents(req.userId)
    ]);

    const [canvasResult, outlookResult, googleResult] = results;

    // Log errors if any
    if (canvasResult.status === 'rejected') console.error('Canvas Error:', canvasResult.reason.message);
    if (outlookResult.status === 'rejected') console.error('Outlook Error:', outlookResult.reason.message);
    if (googleResult.status === 'rejected') console.error('Google Error:', googleResult.reason.message);

    // Extract data
    const canvasAssignments = canvasResult.status === 'fulfilled' ? canvasResult.value : [];
    const outlookEvents = outlookResult.status === 'fulfilled' ? outlookResult.value : [];
    const googleEvents = googleResult.status === 'fulfilled' ? googleResult.value : [];

    // Combine all data
    let allItems = [
      ...canvasAssignments,
      ...outlookEvents,
      ...googleEvents
    ];

    // Enrichment: AI Prioritization
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001/predict-priority';
    console.log("🧠 Sending items to AI Engine for verification/prioritization...");

    // We can run AI requests in parallel for speed
    const enrichedItems = await Promise.all(allItems.map(async (item) => {
      const targetDate = item.due_date || item.start_time;
      // If no date, default to Low priority
      if (!targetDate) return { ...item, priority: 'Low' };

      try {
        // Call Python API
        const axios = require('axios');
        const aiResponse = await axios.post(AI_SERVICE_URL, {
          due_date: targetDate,
          title: item.title,
          platform: item.source_platform
        }, { timeout: 2000 }); // Short timeout so we don't block too long

        return { ...item, priority: aiResponse.data.priority };
      } catch (aiError) {
        // Silent fail for AI, default to Medium or keep existing
        return { ...item, priority: item.priority || 'Medium' };
      }
    }));

    allItems = enrichedItems;

    // Sort by due date (soonest first)
    allItems.sort((a, b) => {
      const dateA = a.due_date || a.start_time;
      const dateB = b.due_date || b.start_time;
      // Handle missing dates by pushing them to the end
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA) - new Date(dateB);
    });

    console.log(`✅ Feed prepared: ${allItems.length} total items`);
    console.log(`   - Canvas: ${canvasAssignments.length} assignments`);
    console.log(`   - Outlook: ${outlookEvents.length} events`);
    console.log(`   - Google: ${googleEvents.length} events`);

    // Create notifications for new/upcoming items (non-blocking)
    createNotificationsForItems(req.userId, allItems)
      .then(notifications => {
        if (notifications.length > 0) {
          console.log(`📬 Created ${notifications.length} notification(s)`);
        }
      })
      .catch(err => console.error('Notification creation error:', err));

    res.json({
      success: true,
      count: allItems.length,
      source_breakdown: {
        canvas: canvasAssignments.length,
        outlook: outlookEvents.length,
        google: googleEvents.length
      },
      data: allItems
    });

  } catch (error) {
    console.error('Feed Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed data',
      details: error.message
    });
  }
});

// Test endpoint - Shows raw Canvas connection
router.get('/test', async (req, res) => {
  try {
    const assignments = await canvasService.getAssignments('test-user');

    // Get user profile too
    const userProfile = await canvasService.getUserProfile();

    res.json({
      canvas_connection: 'active',
      user: userProfile ? {
        name: userProfile.name,
        email: userProfile.primary_email
      } : 'Not available',
      assignment_count: assignments.length,
      sample_assignment: assignments[0] || null,
      is_real_data: !assignments[0]?.raw_assignment ? 'mock' : 'real'
    });

  } catch (error) {
    res.json({
      canvas_connection: 'failed',
      error: error.message,
      using_mock_data: true
    });
  }
});

// Debug endpoint to see raw Canvas data
router.get('/debug/canvas', async (req, res) => {
  try {
    const axios = require('axios');

    // Get user profile
    const profile = await axios.get(
      `${process.env.CANVAS_BASE_URL}/users/self/profile`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CANVAS_API_TOKEN}`
        }
      }
    );

    // Get courses
    const courses = await axios.get(
      `${process.env.CANVAS_BASE_URL}/courses?enrollment_state=active&per_page=3`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CANVAS_API_TOKEN}`
        }
      }
    );

    res.json({
      success: true,
      user: profile.data,
      courses: courses.data.map(c => ({
        id: c.id,
        name: c.name,
        code: c.course_code
      }))
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: "Check .env configuration"
    });
  }
});


// Debug endpoint to see raw Google data
router.get('/debug/google', async (req, res) => {
  try {
    const axios = require('axios');
    const { userId } = req.query; // Allow passing userId manually for debugging if not authenticated
    const targetUserId = req.userId || userId;

    if (!targetUserId) return res.status(400).json({ error: "No userId provided" });

    // 1. Get Token
    const dbRes = await db.query(
      "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'google'",
      [targetUserId]
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
      user_id: targetUserId,
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




// Get Connected Accounts Status
router.get('/status', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await db.query(
      `SELECT platform, is_active, last_sync, access_token 
             FROM connected_accounts 
             WHERE user_id = $1`,
      [userId]
    );

    const accounts = result.rows.map(row => ({
      id: row.platform,
      name: row.platform.charAt(0).toUpperCase() + row.platform.slice(1), // Capitalize
      connected: !!row.access_token,
      last_sync: row.last_sync
    }));

    res.json({ success: true, accounts });
  } catch (err) {
    console.error("❌ Get Status Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ==========================================
// MANUAL LINKING ROUTES (Hybrid Approach)
// ==========================================

// Manual Link - Canvas
router.post('/link-canvas', async (req, res) => {
  const { userId, canvasToken } = req.body;
  const effectiveUserId = req.userId || userId;

  console.log(`🔗 Linking Canvas for UserID: ${effectiveUserId}`); // DEBUG

  if (!effectiveUserId || !canvasToken) return res.status(400).json({ error: "Missing info" });

  // Validate Token First
  const isValid = await canvasService.validateToken(canvasToken);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid Canvas Token or base URL unreachable" });
  }

  try {
    await db.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'canvas', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
      [effectiveUserId, canvasToken]
    );
    res.json({ success: true, message: "Manual link successful!" });
  } catch (err) {
    console.error("❌ Link Canvas DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Manual Link - Google
router.post('/link-google', async (req, res) => {
  const { userId, googleToken } = req.body;
  const effectiveUserId = req.userId || userId;

  console.log(`🔗 Linking Google for UserID: ${effectiveUserId}`);

  if (!effectiveUserId || !googleToken) return res.status(400).json({ error: "Missing info" });

  // Validate Token First
  const validationResult = await googleService.validateToken(googleToken);
  if (validationResult !== true) {
    return res.status(400).json({ error: "Google Error: " + validationResult });
  }

  try {
    await db.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'google', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
      [effectiveUserId, googleToken]
    );
    res.json({ success: true, message: "Google link successful!" });
  } catch (err) {
    console.error("❌ Link Google DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Manual Link - Outlook
router.post('/link-outlook', async (req, res) => {
  const { userId, outlookToken } = req.body;
  const effectiveUserId = req.userId || userId;

  console.log(`🔗 Linking Outlook for UserID: ${effectiveUserId}`);

  if (!effectiveUserId || !outlookToken) return res.status(400).json({ error: "Missing info" });

  // Validate Token First
  const isValid = await outlookService.validateToken(outlookToken);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid Outlook Token or permissions (Calendars.Read) missing" });
  }

  try {
    await db.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token) 
             VALUES ($1, 'outlook', $2)
             ON CONFLICT (user_id, platform) 
             DO UPDATE SET access_token = $2, last_sync = NOW()`,
      [effectiveUserId, outlookToken]
    );
    res.json({ success: true, message: "Outlook link successful!" });
  } catch (err) {
    console.error("❌ Link Outlook DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Disconnect Account
router.delete('/disconnect/:platform', async (req, res) => {
  try {
    const userId = req.userId;
    const { platform } = req.params;

    if (!['canvas', 'google', 'outlook'].includes(platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    await db.query(
      "DELETE FROM connected_accounts WHERE user_id = $1 AND platform = $2",
      [userId, platform]
    );

    res.json({ success: true, message: `Disconnected ${platform}` });
  } catch (err) {
    console.error("❌ Disconnect Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
