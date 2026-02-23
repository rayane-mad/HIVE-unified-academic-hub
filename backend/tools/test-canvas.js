// test-canvas.js
const canvasService = require('./src/services/canvasService');

async function testCanvasConnection() {
  console.log('Testing Canvas API connection...');
  console.log('===============================');
  
  try {
    const assignments = await canvasService.getAssignments('test-user');
    
    console.log(`✅ Success! Got ${assignments.length} items`);
    console.log('\nFirst item:');
    console.log(JSON.stringify(assignments[0], null, 2));
    
    if (assignments[0]?.raw_data) {
      console.log('\n📊 Raw Canvas data structure:');
      console.log(Object.keys(assignments[0].raw_data));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCanvasConnection();
