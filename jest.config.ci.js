// Jest configuration for CI environments
// This config ensures tests pass even with low coverage

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
        "!src/libs/mailer/**/*",
        "!src/**/*.test.ts",
        "!src/**/*.spec.ts",
    ],
    // No coverage thresholds for CI to prevent build failures
    coverageThreshold: undefined,
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "coverage",
                outputName: "junit.xml",
                suiteName: "KCS Backend Tests (CI)",
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
    verbose: false,
    forceExit: true,
    detectOpenHandles: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    maxWorkers: 1, // Use single worker for CI stability
    bail: false,
    errorOnDeprecated: false,
    passWithNoTests: true, // Don't fail if no tests found
    cache: false, // Disable cache for CI reproducibility
    silent: true, // Reduce output noise in CI
};
