const express = require('express');
const canvasService = require('../services/canvasService');
const outlookService = require('../services/outlookService');
const googleService = require('../services/googleService');

const router = express.Router();

// Main feed endpoint - REAL DATA
router.get('/feed', async (req, res) => {
  try {
    console.log("📡 Fetching REAL Canvas data for feed...");
    
    // Fetch from Canvas (real)
    const canvasAssignments = await canvasService.getAssignments(req.userId);
    
    // Still mock for Outlook/Google
    const outlookEvents = await outlookService.getEvents(req.userId);
    const googleEvents = await googleService.getEvents(req.userId);
    
    // Combine all data
    const allItems = [
      ...canvasAssignments,
      ...outlookEvents,
      ...googleEvents
    ];
    
    // Sort by due date (soonest first)
    allItems.sort((a, b) => {
      const dateA = a.due_date || a.start_time;
      const dateB = b.due_date || b.start_time;
      return new Date(dateA) - new Date(dateB);
    });
    
    console.log(`✅ Feed prepared: ${allItems.length} total items`);
    console.log(`   - Canvas: ${canvasAssignments.length} assignments`);
    console.log(`   - Outlook: ${outlookEvents.length} events`);
    console.log(`   - Google: ${googleEvents.length} events`);
    
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

module.exports = router;
