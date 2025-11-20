// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock Redis client to avoid connection issues during testing
jest.mock('../config/redis', () => ({
  redisClient: {
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    isReady: true,
  },
}));

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long';

// Increase timeout for all tests
jest.setTimeout(30000);

// Dummy test to prevent "no tests" error
test('setup file loaded', () => {
  expect(true).toBe(true);
});
