const axios = require('axios');
const { normalizeCanvasAssignment } = require('../utils/normalizer');
const db = require('../../db');
require('dotenv').config();

class CanvasService {
  async getAssignments(userId) {
    try {
      console.log(`🔗 Connecting to REAL Canvas API for User ${userId}...`);

      // 1. Try fetching token from DB first
      const dbRes = await db.query(
        "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'canvas'",
        [userId]
      );

      let token = dbRes.rows[0]?.access_token;

      // 2. Fallback to env if not in DB
      if (!token) {
        token = process.env.CANVAS_API_TOKEN;
      }

      if (!token) {
        console.warn("⚠️ No Canvas API token found (DB or ENV)");
        throw new Error('No Canvas API token');
      }

      // 1. Get user's courses first
      console.log("📚 Fetching enrolled courses...");
      const coursesResponse = await axios.get(
        `${process.env.CANVAS_BASE_URL}/courses?enrollment_state=active`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      const courses = coursesResponse.data;
      console.log(`✅ Found ${courses.length} courses`);

      // 2. Get assignments for each course
      let allAssignments = [];

      for (const course of courses.slice(0, 3)) { // Limit to 3 courses for speed
        try {
          // console.log(`   Fetching assignments for: ${course.name}`);

          const assignmentsResponse = await axios.get(
            `${process.env.CANVAS_BASE_URL}/courses/${course.id}/assignments`,
            {
              headers: { Authorization: `Bearer ${token}` },
              // Removed strict bucket: 'future' to allow all active assignments (including undated or immediate ones)
              params: { include: ['submission'] }
            }
          );

          // Add course info to each assignment
          const assignmentsWithCourse = assignmentsResponse.data.map(assignment => ({
            ...assignment,
            course_id: course.id,
            course_name: course.name,
            course_code: course.course_code
          }));

          allAssignments = [...allAssignments, ...assignmentsWithCourse];

        } catch (courseError) {
          console.error(`   Skipping course ${course.name}:`, courseError.message);
          continue;
        }
      }

      console.log(`📊 Total assignments found: ${allAssignments.length}`);

      // 3. Normalize the data
      return allAssignments.map(normalizeCanvasAssignment);

    } catch (error) {
      console.error("❌ Canvas API Error:", error.message);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.log("⚠️ Canvas error, returning empty list (Mock data disabled)");
        return [];
      }

      throw error;
    }
  }

  // New method: Get user profile
  async getUserProfile() {
    // This method might need userId/token args too if used, but for now mostly unused or for test
    return null;
  }

  async validateToken(token) {
    try {
      if (!token) return false;
      await axios.get(`${process.env.CANVAS_BASE_URL}/users/self/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      return true;
    } catch (err) {
      console.error("❌ Canvas Token Validation Failed:", err.message);
      return false;
    }
  }

  async submitAssignment(userId, courseId, assignmentId, submissionText) {
    try {
      console.log(`📤 Submitting assignment ${assignmentId} for user ${userId}...`);

      // 1. Get Token
      const dbRes = await db.query(
        "SELECT access_token FROM connected_accounts WHERE user_id = $1 AND platform = 'canvas'",
        [userId]
      );
      let token = dbRes.rows[0]?.access_token;
      if (!token) token = process.env.CANVAS_API_TOKEN;
      if (!token) throw new Error('No Canvas Token found');

      // 2. Post Submission
      const url = `${process.env.CANVAS_BASE_URL}/courses/${courseId}/assignments/${assignmentId}/submissions`;
      const body = {
        submission: {
          submission_type: 'online_text_entry',
          body: submissionText
        }
      };

      const response = await axios.post(url, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("✅ Canvas Validated Submission:", response.data);
      return response.data;

    } catch (error) {
      console.error("❌ Canvas Submission Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Submission failed');
    }
  }
}

module.exports = new CanvasService();
