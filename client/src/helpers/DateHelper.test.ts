/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { getRelativeTime } from "./DateHelper";
import { intlStub } from "../test/testUtils";

describe("getRelativeTime", () => {
  it("prefixes with the execution date and shows the absolute date", () => {
    const result = getRelativeTime(new Date().valueOf(), intlStub);
    expect(result).toMatch(/^Execution date: .*/);
    expect(result).toMatch(/(in |ago\b)?\s?-?\d+ minutes?/);
  });

  it("uses the hour period below one day", () => {
    const result = getRelativeTime(
      new Date().valueOf() - 2 * 3600 * 1000,
      intlStub
    );
    expect(result).toMatch(/hours?\b/);
  });

  it("uses the day period above one day", () => {
    const result = getRelativeTime(
      new Date().valueOf() - 2 * 86400 * 1000,
      intlStub
    );
    expect(result).toMatch(/days?\b/);
  });

  it("future dates render a future relative time", () => {
    const result = getRelativeTime(
      new Date().valueOf() + 2 * 3600 * 1000,
      intlStub
    );
    expect(result).toMatch(/hours?\b/);
  });
});
