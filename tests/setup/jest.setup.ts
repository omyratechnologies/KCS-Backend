// Jest setup file
import { jest } from "@jest/globals";

// Mock console methods for cleaner test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = "development"; // Change to development to pass the enum validation
process.env.PORT = "4500";
process.env.JWT_SECRET = "test-secret-key-for-jwt-tokens";
process.env.DATABASE_URL = "test-database-url";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.REDIS_URI = "redis://localhost:6379";
process.env.OTTOMAN_BUCKET_NAME = "test_bucket";
process.env.OTTOMAN_CONNECTION_STRING = "couchbase://localhost";
process.env.OTTOMAN_USERNAME = "test_user";
process.env.OTTOMAN_PASSWORD = "test_password";
process.env.AWS_ACCESS_KEY_ID = "test_aws_key";
process.env.AWS_ACCESS_SECRET_KEY = "test_aws_secret";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_SES_EMAIL_FROM = "test@example.com";
process.env.AWS_SES_EMAIL_FROM_NAME = "Test App";
process.env.R2_BUCKET = "test-bucket";
process.env.R2_ENDPOINT = "https://test-endpoint.com";
process.env.R2_REGION = "auto";
process.env.R2_ACCESS_KEY_ID = "test_r2_key";
process.env.R2_SECRET_ACCESS_KEY = "test_r2_secret";
process.env.R2_BUCKET_URL = "https://test-bucket.com";

// Global test utilities
global.testTimeout = (ms = 5000) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Date for consistent testing
const mockDate = new Date("2025-08-05T10:00:00Z");
global.Date = class extends Date {
    constructor(date?: string | number | Date) {
        if (date) {
            super(date);
        } else {
            super(mockDate);
        }
    }

    static now() {
        return mockDate.getTime();
    }
} as DateConstructor;

// Global cleanup
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});

// Global teardown
afterAll(async () => {
    // Clear any remaining timers
    jest.clearAllTimers();
    jest.useRealTimers();

    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    // Wait a bit to ensure all async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100));
});
