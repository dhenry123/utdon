import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals are disabled in vitest config, so the RTL auto-cleanup
// (which relies on the global afterEach) must be wired manually
afterEach(() => {
  cleanup();
});
