import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverage: true,
  testPathIgnorePatterns: ["setExternalStatus"],
  setupFiles: ["./jestLoadEnvironmentTest.ts"],
};

export default config;
