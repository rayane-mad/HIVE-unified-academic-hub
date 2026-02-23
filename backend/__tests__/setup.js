// Test setup file
// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_APP_PASSWORD = 'test-password';

// Suppress console output during tests unless there's an error
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error for debugging test failures
    error: console.error,
};
