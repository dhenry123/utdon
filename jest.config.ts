export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  // client/ has its own vitest suite (npm test in client/)
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'client/', 'devtest*'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json'
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // This is key - it enables proper ESM support
  transformIgnorePatterns: [],
  setupFiles: ["./jestLoadEnvironmentTest.ts"],
};