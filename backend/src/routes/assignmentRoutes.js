const express = require('express');
const router = express.Router();

const canvasService = require('../services/canvasService');

// Submit assignment
router.post('/submit/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;
  const { submission_text, file_url, course_id } = req.body;
  const userId = req.userId; // Middleware must ensure this exists

  if (!course_id) {
    return res.status(400).json({ success: false, error: 'Missing course_id' });
  }

  try {
    console.log(`Submission received for assignment \${assignmentId} (Course \${course_id})`);

    // Call real service
    const result = await canvasService.submitAssignment(userId, course_id, assignmentId, submission_text);

    res.json({
      success: true,
      message: 'Assignment submitted successfully to Canvas!',
      data: result
    });

  } catch (error) {
    console.error('Submission Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Submission failed'
    });
  }
});

module.exports = router;

