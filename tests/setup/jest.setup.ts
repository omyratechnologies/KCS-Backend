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
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jwt-tokens";
process.env.DATABASE_URL = "test-database-url";
process.env.REDIS_URL = "redis://localhost:6379";

// Global test utilities
global.testTimeout = (ms = 5000) =>
    new Promise((resolve) => setTimeout(resolve, ms));

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
