const axios = require('axios');
const { normalizeCanvasAssignment } = require('../utils/normalizer');
require('dotenv').config();

class CanvasService {
  async getAssignments(userId) {
    try {
      console.log("🔗 Attempting to connect to REAL Canvas API...");
      console.log("Base URL:", process.env.CANVAS_BASE_URL);

      // Test if we have token
      if (!process.env.CANVAS_API_TOKEN || process.env.CANVAS_API_TOKEN === '20970~FX23rLcU9WEXf9Z4XxxQ8aW2NvQAr9YcGn34ufLUy4xU7NKU49vUVCxtD4nrxYXa') {
        console.error("❌ No Canvas API token found in .env file!");
        console.error("Please get token from Canvas Settings > Approved Integrations");

        // Fall back to mock data
        const mockData = require('../mock/canvasAssignments.json');
        console.log("⚠️ Using mock data as fallback");
        return mockData.map(normalizeCanvasAssignment);
      }

      // REAL API CALL
      // Option 1: Get planner items (assignments, quizzes, announcements)
      const url = `${process.env.CANVAS_BASE_URL}/planner/items?filter=new_activity`;

      // Option 2: Get assignments (more detailed)
      // const url = `${process.env.CANVAS_BASE_URL}/courses?enrollment_state=active&include[]=total_scores`;

      console.log("🌐 Fetching from:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log(`✅ Canvas connected! Found ${response.data.length} items`);

      // If no data from Canvas, use mock as fallback
      if (!response.data || response.data.length === 0) {
        console.log("⚠️ Canvas returned empty, using mock data");
        const mockData = require('../mock/canvasAssignments.json');
        return mockData.map(normalizeCanvasAssignment);
      }

      // Transform Canvas data to Hive format
      const normalizedData = response.data.map(item => {
        return {
          assignment_id: String(item.plannable_id || item.id || Math.random()),
          source_platform: 'Canvas',
          type: 'assignment',
          title: item.plannable?.title || item.title || 'Untitled',
          description: item.plannable?.details || item.description || 'No description',
          course: item.context_name || item.course?.name || 'Unknown Course',
          due_date: item.plannable_date || item.due_at || null,
          status: item.submissions?.submitted ? 'submitted' : 'pending',
          link: item.html_url || '#',
          priority: 'Medium',
          raw_data: item // Keep raw data for debugging
        };
      });

      return normalizedData;

    } catch (error) {
      console.error("❌ Canvas API Error:", error.message);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response:", error.response.data);

        // Handle common errors
        if (error.response.status === 401) {
          console.error("❌ Invalid API token. Get a new one from Canvas Settings.");
        } else if (error.response.status === 404) {
          console.error("❌ Canvas URL incorrect. Check CANVAS_BASE_URL in .env");
        }
      }

      // Fallback to mock data
      console.log("⚠️ Falling back to mock data due to error");
      const mockData = require('../mock/canvasAssignments.json');
      return mockData.map(normalizeCanvasAssignment);
    }
  }
  async validateToken(token) {
    try {
      if (!token) return false;
      await axios.get(`${process.env.CANVAS_BASE_URL}/users/self/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      return true;
    } catch (err) {
      console.error("❌ Canvas Token Validation Failed:", err.message);
      return false;
    }
  }

}

module.exports = new CanvasService();
