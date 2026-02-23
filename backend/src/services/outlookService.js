const axios = require('axios');
const { normalizeOutlookEvent } = require('../utils/normalizer');
require('dotenv').config();

const db = require('../../db');

class OutlookService {
  async getEvents(userId) {
    try {
      console.log(`📧 Connecting to Outlook Calendar (Graph API) for User ${userId}...`);

      // 1. Try fetching token from DB first
      const dbRes = await db.query(
        "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'outlook'",
        [userId]
      );

      let token = dbRes.rows[0]?.access_token;

      // 2. Fallback to env if not in DB (for backward compatibility)
      if (!token) {
        console.log("⚠️ No Outlook token in DB, checking .env...");
        token = process.env.OUTLOOK_ACCESS_TOKEN;
      }

      if (!token) {
        console.warn("⚠️ No Outlook Access Token found (DB or ENV)");
        throw new Error('No Outlook Access Token');
      }

      console.log(`✅ Found Outlook Token for User ${userId}: ${token.substring(0, 10)}...`);

      // Time range: Now to 60 days from now (Extended)
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 60);

      console.log(`📅 Fetching Outlook View from ${now.toISOString()} to ${futureDate.toISOString()}`);

      let allEvents = [];

      // 1. Get List of All Calendars
      const calendarList = await axios.get('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(`📂 Found ${calendarList.data.value.length} calendars. Checking each one...`);

      // 2. Fetch Events from EACH Calendar
      for (const cal of calendarList.data.value) {
        try {
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/calendars/${cal.id}/calendarView`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                startDateTime: now.toISOString(),
                endDateTime: futureDate.toISOString(),
                '$select': 'subject,start,end,webLink,importance,bodyPreview',
                '$top': 20,
                '$orderby': 'start/dateTime'
              },
              timeout: 5000 // Short timeout per calendar
            }
          );

          const count = response.data.value.length;
          if (count > 0) {
            console.log(`   ✅ [${cal.name}]: Found ${count} events!`);
            allEvents = [...allEvents, ...response.data.value];
          } else {
            console.log(`   Detailed Log: [${cal.name}]: 0 events.`);
          }

        } catch (err) {
          console.error(`   ❌ Failed to read calendar [${cal.name}]: ${err.message}`);
        }
      }

      console.log(`✅ TOTAL COLLECTED events: ${allEvents.length}`);
      if (allEvents.length > 0) {
        console.log("Example event:", JSON.stringify(allEvents[0], null, 2));
      }

      return allEvents.map(item => normalizeOutlookEvent(item));

    } catch (error) {
      console.error("❌ Outlook Service Error:", error.message);
      if (error.response) console.error("Outlook API Status:", error.response.status);

      console.log("⚠️ Returning empty list (Mock data disabled)");
      return [];
    }
  }
  async validateToken(token) {
    try {
      if (!token) return false;
      // Check calendars to ensure Calendars.Read scope is present
      await axios.get('https://graph.microsoft.com/v1.0/me/calendars', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      return true;
    } catch (err) {
      console.error("❌ Outlook Token Validation Failed:", err.message);
      return false;
    }
  }
}

module.exports = new OutlookService();

