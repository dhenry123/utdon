/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import { buildHeader } from "./rtk";

describe("buildHeader", () => {
  it("wraps the value in the scrapUrlHeader key", () => {
    expect(buildHeader("Authorization:Bearer xxx")).toEqual({
      scrapUrlHeader: "Authorization:Bearer xxx",
    });
  });
});
