import type { Config } from '@jest/types';

// This file tells Jest how to run our tests
const config: Config.InitialOptions = {
  // Use the 'ts-jest' preset to run .ts files directly
  preset: 'ts-jest',
  // The test environment (Node.js for a backend)
  testEnvironment: 'node',
  // Show verbose output
  verbose: true,
  // Automatically clear mocks between tests
  clearMocks: true,
  // Where to find our test files
  roots: ['<rootDir>/src'],
  // The pattern Jest uses to find test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  // How to transform .ts files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // This is a special setup file that runs *before* our tests
  // We'll use it to start our in-memory database
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};

export default config;