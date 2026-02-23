// simple-test.js
const canvasService = require('./src/services/canvasService');

async function test() {
  console.log('Testing updated Canvas service...');
  const assignments = await canvasService.getAssignments('test');
  console.log(`Got ${assignments.length} assignments`);
  
  if (assignments.length > 0) {
    console.log('\nSample assignment:');
    console.log(JSON.stringify(assignments[0], null, 2));
  }
}

test().catch(console.error);
