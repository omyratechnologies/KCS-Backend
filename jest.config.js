export default {
    preset: "ts-jest/presets/default-esm",
    extensionsToTreatAsEsm: [".ts"],
    testEnvironment: "node",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/*.(test|spec).+(ts|tsx|js)"],
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverageFrom: [
        "src/**/*.{ts,js}",
        "!src/**/*.d.ts",
        "!src/index.ts",
        "!src/types/**/*",
        "!src/schema/**/*",
        "!src/libs/mailer/**/*", // Exclude problematic mailer files
        "!src/**/*.test.ts",
        "!src/**/*.spec.ts",
    ],
    coverageThreshold: {
        global: {
            branches: 10,
            functions: 10,
            lines: 10,
            statements: 10,
        },
    },
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "coverage",
                outputName: "junit.xml",
                suiteName: "KCS Backend Tests",
                classNameTemplate: "{classname}",
                titleTemplate: "{title}",
                ancestorSeparator: " › ",
                usePathForSuiteName: true,
            },
        ],
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html", "cobertura", "json-summary"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
    testTimeout: 30000,
    verbose: false, // Set to false for cleaner CI output
    forceExit: true,
    detectOpenHandles: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    maxWorkers: "50%", // Use half of available workers
    bail: false, // Don't stop on first failure
    errorOnDeprecated: false,
    // Cache settings for better performance
    cache: true,
    cacheDirectory: "<rootDir>/.jest-cache",
};
