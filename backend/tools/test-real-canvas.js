// test-real-canvas.js
require('dotenv').config();
const axios = require('axios');

console.log('=== Testing REAL Canvas Connection ===');
console.log('=====================================');
console.log('Token exists:', !!process.env.CANVAS_API_TOKEN);
console.log('Token starts with:', process.env.CANVAS_API_TOKEN?.substring(0, 10));
console.log('Base URL:', process.env.CANVAS_BASE_URL);

async function testConnection() {
  try {
    // Test 1: Get user profile (simple endpoint)
    console.log('\n🔍 Test 1: Getting user profile...');
    const profileResponse = await axios.get(
      `${process.env.CANVAS_BASE_URL}/users/self/profile`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CANVAS_API_TOKEN}`
        },
        timeout: 5000
      }
    );
    console.log('✅ User Profile Success!');
    console.log('Name:', profileResponse.data.name);
    console.log('Email:', profileResponse.data.primary_email);

    // Test 2: Get courses
    console.log('\n🔍 Test 2: Getting enrolled courses...');
    const coursesResponse = await axios.get(
      `${process.env.CANVAS_BASE_URL}/courses?enrollment_state=active&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CANVAS_API_TOKEN}`
        }
      }
    );
    console.log(`✅ Courses Success! Found ${coursesResponse.data.length} courses:`);
    coursesResponse.data.forEach(course => {
      console.log(`   - ${course.course_code}: ${course.name}`);
    });

    // Test 3: Get planner items (assignments)
    console.log('\n🔍 Test 3: Getting planner items (assignments)...');
    const plannerResponse = await axios.get(
      `${process.env.CANVAS_BASE_URL}/planner/items?per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CANVAS_API_TOKEN}`
        }
      }
    );
    console.log(`✅ Planner Success! Found ${plannerResponse.data.length} items:`);
    plannerResponse.data.forEach(item => {
      console.log(`   - ${item.plannable_type}: ${item.plannable?.title || 'No title'}`);
    });

    console.log('\n🎉 ALL TESTS PASSED! Real Canvas API is working!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('🔴 Error: Invalid token. Get a new one from Canvas Settings.');
      } else if (error.response.status === 404) {
        console.error('🔴 Error: URL not found. Check CANVAS_BASE_URL.');
      }
    }
  }
}

testConnection();
