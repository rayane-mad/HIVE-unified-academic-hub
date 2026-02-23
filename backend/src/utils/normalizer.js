// Normalize Canvas assignment data (REAL API version)
const normalizeCanvasAssignment = (canvasData) => {
  // Handle both mock data and real API data
  const item = canvasData.plannable || canvasData;

  const normalized = {
    id: String(canvasData.plannable_id || canvasData.id || Math.random()),
    source_platform: 'Canvas',
    type: 'assignment',
    title: canvasData.name || item?.title || canvasData.title || 'Untitled', // Canvas uses 'name', not 'title'
    description: (item?.details || canvasData.description || 'No description provided')
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim().substring(0, 200) + (canvasData.description?.length > 200 ? '...' : ''), // Truncate
    course: canvasData.course_name || canvasData.context_name || canvasData.course_code || 'Unknown Course',
    course_id: canvasData.context_id || canvasData.plannable?.context_id || canvasData.course_id,
    due_date: canvasData.plannable_date || canvasData.due_at || item?.due_at || null,
    status: canvasData.submissions?.submitted ? 'submitted' : 'pending',
    link: canvasData.html_url || item?.html_url || '#',
    priority: 'Medium'
  };

  // Debug logging
  console.log(`📋 Normalized: ${normalized.title} | course_id: ${normalized.course_id}`);

  return normalized;
};

// Normalize Outlook event data
const normalizeOutlookEvent = (outlookData) => {
  return {
    id: `outlook-${outlookData.id}`,
    source_platform: 'Outlook',
    type: 'event',
    title: outlookData.subject || 'Untitled Event',
    course: 'Outlook Calendar',
    description: outlookData.bodyPreview || 'No description',
    start_time: outlookData.start?.dateTime || outlookData.start?.date || null,
    end_time: outlookData.end?.dateTime || outlookData.end?.date || null,
    event_type: 'meeting',
    status: 'upcoming',
    priority: 'Medium'
  };
};

// Normalize Google Calendar event data
const normalizeGoogleEvent = (googleData) => {
  return {
    id: `google-${googleData.id}`,
    source_platform: 'Google',
    type: 'event',
    title: googleData.summary || 'Untitled Event',
    course: 'Google Calendar',
    description: googleData.description || 'No description',
    start_time: googleData.start?.dateTime || googleData.start?.date || null,
    end_time: googleData.end?.dateTime || googleData.end?.date || null,
    event_type: 'exam',
    status: 'upcoming',
    priority: 'Medium'
  };
};

module.exports = {
  normalizeCanvasAssignment,
  normalizeOutlookEvent,
  normalizeGoogleEvent
};
