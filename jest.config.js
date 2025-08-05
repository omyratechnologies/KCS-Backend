export default {
    preset: "ts-jest/presets/default-esm",
    extensionsToTreatAsEsm: [".ts"],
    testEnvironment: "node",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/*.(test|spec).+(ts|tsx|js)",
    ],
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
    ],
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
            },
        ],
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html", "cobertura"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    maxWorkers: 1,
    // Removed runInBand as it's causing warnings in some Jest versions
    // runInBand: true,
};
