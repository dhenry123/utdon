/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { describe, test, expect } from "@jest/globals";
import { parseSemver, compareSemver } from "../src/lib/semver";

describe("semver", () => {
  describe("parseSemver", () => {
    test("parseSemver - plain version", () => {
      const result = parseSemver("1.52.0");
      expect(result).not.toBeNull();
      expect(result?.major).toEqual(1);
      expect(result?.minor).toEqual(52);
      expect(result?.patch).toEqual(0);
      expect(result?.prerelease).toEqual([]);
    });

    test("parseSemver - v prefix", () => {
      const result = parseSemver("v1.52.0");
      expect(result).not.toBeNull();
      expect(result?.major).toEqual(1);
      expect(result?.minor).toEqual(52);
      expect(result?.patch).toEqual(0);
    });

    test("parseSemver - upper V prefix", () => {
      const result = parseSemver("V1.52.0");
      expect(result).not.toBeNull();
      expect(result?.major).toEqual(1);
    });

    test("parseSemver - prerelease", () => {
      const result = parseSemver("1.52.0-rc.1");
      expect(result).not.toBeNull();
      expect(result?.prerelease).toEqual(["rc", "1"]);
    });

    test("parseSemver - build metadata is parsed but ignored for ordering", () => {
      const result = parseSemver("1.0.0-alpha.1+build.5");
      expect(result).not.toBeNull();
      expect(result?.prerelease).toEqual(["alpha", "1"]);
      expect(compareSemver("1.0.0-alpha.1+build.5", "1.0.0-alpha.1")).toEqual(
        0
      );
    });

    test("parseSemver - invalid inputs return null", () => {
      expect(parseSemver("1.52")).toBeNull();
      expect(parseSemver("v1")).toBeNull();
      expect(parseSemver("1.52.0.4")).toBeNull();
      expect(parseSemver("abc")).toBeNull();
      expect(parseSemver("latest")).toBeNull();
      expect(parseSemver("")).toBeNull();
    });
  });

  describe("compareSemver", () => {
    test("compareSemver - minor precedence", () => {
      expect(compareSemver("1.51.1", "1.52.0")).toBeLessThan(0);
      expect(compareSemver("1.52.0", "1.51.1")).toBeGreaterThan(0);
    });

    test("compareSemver - major precedence beats patch", () => {
      expect(compareSemver("2.0.0", "1.99.99")).toBeGreaterThan(0);
    });

    test("compareSemver - numeric fields not compared as strings", () => {
      // string comparison would wrongly rank v1.2.0 over v1.10.0
      expect(compareSemver("v1.10.0", "v1.2.0")).toBeGreaterThan(0);
    });

    test("compareSemver - v prefix ignored", () => {
      expect(compareSemver("v1.52.0", "1.52.0")).toEqual(0);
    });

    test("compareSemver - prerelease is lower than its release", () => {
      expect(compareSemver("1.52.0-rc.1", "1.52.0")).toBeLessThan(0);
    });

    test("compareSemver - numeric identifiers compare numerically", () => {
      expect(compareSemver("1.0.0-alpha.2", "1.0.0-alpha.10")).toBeLessThan(0);
    });

    test("compareSemver - numeric identifiers are lower than alphanumeric", () => {
      expect(compareSemver("1.0.0-1", "1.0.0-alpha")).toBeLessThan(0);
    });

    test("compareSemver - shorter prerelease list loses on equal prefix", () => {
      expect(compareSemver("1.0.0-alpha", "1.0.0-alpha.1")).toBeLessThan(0);
    });

    test("compareSemver - build metadata ignored", () => {
      expect(compareSemver("1.0.0+build.1", "1.0.0+build.2")).toEqual(0);
    });

    test("compareSemver - null when either side is not semver", () => {
      expect(compareSemver("abc", "1.0.0")).toBeNull();
      expect(compareSemver("1.0.0", "abc")).toBeNull();
      expect(compareSemver("1.2", "1.2.3")).toBeNull();
    });
  });
});
