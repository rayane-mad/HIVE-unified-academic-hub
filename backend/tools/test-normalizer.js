const { normalizeCanvasAssignment } = require('./src/utils/normalizer');
const mockData = require('./src/mock/canvasAssignments.json');

const result = normalizeCanvasAssignment(mockData[0]);
console.log('Test Result:');
console.log(JSON.stringify(result, null, 2));
