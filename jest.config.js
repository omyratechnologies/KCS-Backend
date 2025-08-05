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
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html", "cobertura"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
