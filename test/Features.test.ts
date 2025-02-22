/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { readFileSync } from "fs";
import { compareVersion, recordsOrder } from "../src/lib/Features";
import { UptodateForm } from "../src/Global.types";

describe("Features", () => {
  describe("compareVersion", () => {
    test("compareVersion - strictlyEqual true", () => {
      const name = "xxxxx";
      const result = compareVersion(name, "x100", "x100", "", "");
      expect(result.name).toEqual(name);
      expect(result.githubLatestRelease).toEqual("x100");
      expect(result.productionVersion).toEqual("x100");
      expect(result.strictlyEqual).toBeTruthy();
      expect(result.productionVersionIncludesGithubLatestRelease).toBeFalsy();
      expect(result.githubLatestReleaseIncludesProductionVersion).toBeFalsy();
      expect(result.state).toBeTruthy();
      expect(result.ts).toBeGreaterThan(0);
    });

    test("compareVersion - githubLatestReleaseIncludesProductionVersion", () => {
      const name = "xxxxx";
      const result = compareVersion(name, "x100", "x10", "", "");
      expect(result.name).toEqual(name);
      expect(result.githubLatestRelease).toEqual("x100");
      expect(result.productionVersion).toEqual("x10");
      expect(result.strictlyEqual).toBeFalsy();
      expect(result.productionVersionIncludesGithubLatestRelease).toBeFalsy();
      expect(result.githubLatestReleaseIncludesProductionVersion).toBeTruthy();
      expect(result.state).toBeTruthy();
      expect(result.ts).toBeGreaterThan(0);
    });

    test("compareVersion - productionVersionIncludesGithubLatestRelease", () => {
      const name = "xxxxx";
      const result = compareVersion(name, "100", "x100", "", "");
      expect(result.name).toEqual(name);
      expect(result.githubLatestRelease).toEqual("100");
      expect(result.productionVersion).toEqual("x100");
      expect(result.strictlyEqual).toBeFalsy();
      expect(result.productionVersionIncludesGithubLatestRelease).toBeTruthy();
      expect(result.githubLatestReleaseIncludesProductionVersion).toBeFalsy();
      expect(result.state).toBeTruthy();
      expect(result.ts).toBeGreaterThan(0);
    });
  });

  describe("recordsOrder", () => {
    const json = JSON.parse(
      readFileSync(`${process.cwd()}/test/samples/reorder1.json`, "utf-8")
    ) as UptodateForm[];
    const origOrder = json.map((item) => item.name);
    const json1 = JSON.parse(
      readFileSync(`${process.cwd()}/test/samples/reorder2.json`, "utf-8")
    ) as UptodateForm[];
    const origOrder1 = json.map((item) => item.name);
    test("recordsOrder - Nothing to do", () => {
      const result = recordsOrder(json);
      const orderedNames = result.map((item) => item.name);
      // console.log(origOrder);
      // console.log(orderedNames);
      expect(origOrder).toEqual(orderedNames);
    });
    test("recordsOrder - Reorder", () => {
      const result = recordsOrder(json1);
      const orderedNames = result.map((item) => item.name);
      // console.log(origOrder1);
      // console.log(orderedNames);
      expect(origOrder1).not.toEqual(orderedNames);
      expect(orderedNames[0]).toEqual("immich");
    });
  });
});
