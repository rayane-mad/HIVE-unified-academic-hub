const { normalizeCanvasAssignment } = require('../utils/normalizer');

class CanvasService {
  async getAssignments(userId) {
    try {
      // For MVP: Return mock data
      const mockData = require('../mock/canvasAssignments.json');
      
      // If we had real API access:
      // const response = await axios.get(`\${process.env.CANVAS_API_URL}/assignments`, {
      //   headers: { Authorization: `Bearer \${process.env.CANVAS_TOKEN}` }
      // });
      // return response.data.map(normalizeCanvasAssignment);
      
      return mockData.map(normalizeCanvasAssignment);
    } catch (error) {
      console.error('Canvas Service Error:', error);
      return [];
    }
  }
}

module.exports = new CanvasService();

