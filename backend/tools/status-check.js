// status-check.js
require('dotenv').config();
console.log('=== Canvas Integration Status ===');
console.log('Token present:', !!process.env.CANVAS_API_TOKEN);
console.log('Base URL:', process.env.CANVAS_BASE_URL);

const token = process.env.CANVAS_API_TOKEN || '';
console.log('Token length:', token.length);
console.log('Token format:', token.startsWith('20970~') ? '✅ Correct format' : '⚠️ Check format');

if (token.includes('YOUR') || token.includes('REAL_TOKEN')) {
  console.log('❌ ERROR: Still using placeholder token!');
  console.log('Get real token from: https://aui.instructure.com/profile/settings');
}
