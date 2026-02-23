const axios = require('axios');
const { normalizeGoogleEvent } = require('../utils/normalizer');
require('dotenv').config();

const db = require('../../db');

class GoogleService {
  async getEvents(userId) {
    try {
      console.log(`📅 Connecting to Google Calendar API for User ${userId}...`);

      // 1. Try fetching token from DB first
      const dbRes = await db.query(
        "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'google'",
        [userId]
      );

      let token = dbRes.rows[0]?.access_token;

      // 2. Fallback to env
      if (!token) {
        console.log("⚠️ No Google token in DB, checking .env...");
        token = process.env.GOOGLE_ACCESS_TOKEN;
      }

      if (!token) {
        console.warn("⚠️ No GOOGLE_ACCESS_TOKEN found (DB or ENV)");
        throw new Error('No Google Access Token');
      }

      // Fetch events from primary calendar
      // default: singleEvents=true expands recurring events
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime'
          },
          timeout: 8000
        }
      );

      console.log(`✅ Found ${response.data.items.length} Google Calendar events`);

      return response.data.items.map(item => normalizeGoogleEvent(item)); // Ensure normalizer handles the API shape

    } catch (error) {
      console.error('❌ Google Service Error:', error.message);
      if (error.response) {
        console.error('Google API Status:', error.response.status);
      }

      console.log("⚠️ Returning empty list (Mock data disabled)");
      return [];
    }
  }
  async validateToken(token) {
    try {
      if (!token) return false;
      // Check primary calendar to validate scope
      await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      return true;
    } catch (err) {
      console.error("❌ Google Token Validation Failed:", err.message);
      let errorMessage = err.message;

      if (err.response && err.response.data) {
        try {
          errorMessage = JSON.stringify(err.response.data.error || err.response.data);
        } catch (e) {
          errorMessage = "Unknown Google Error (Parse Fail)";
        }
      }

      return errorMessage;
    }
  }
}

module.exports = new GoogleService();

