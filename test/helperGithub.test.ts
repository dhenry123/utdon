/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  getLatestRelease,
  getGithubTagsurl as getGithubTagsUrl,
  getGithubTagsurl,
} from "../src/lib/helperGithub";
import crypto from "crypto";
import { scrapUrl } from "../src/lib/Features";

describe("github", () => {
  test("getGithubTagsurl", () => {
    const url = getGithubTagsUrl(
      "https://github.com/healthchecks/healthchecks"
    );
    expect(url).toEqual(
      "https://api.github.com/repos/healthchecks/healthchecks/tags"
    );
  });

  test("scrap Github tags - url ok", async () => {
    const githubRepo = "https://github.com/healthchecks/healthchecks";
    await scrapUrl(getGithubTagsurl(githubRepo), "GET").then((data: string) => {
      expect(data).toBeDefined();
      const json = JSON.parse(data);
      expect(Array.isArray(json)).toBeTruthy();
      expect(json.length).toBeGreaterThan(0);
    });
  });

  test("scrap Github tags - wrong url", async () => {
    const githubRepo = `https://github.com/${crypto.randomUUID()}/${crypto.randomUUID()}`;
    await scrapUrl(getGithubTagsurl(githubRepo), "GET")
      .then(() => {
        // unexpected
        expect(false).toBeTruthy();
      })
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  test("getLatestRelease - healthchecks", async () => {
    const githubRepo = "https://github.com/healthchecks/healthchecks";
    await getLatestRelease(githubRepo, "^[v|V][0-9.]+$").then(
      (data: string) => {
        expect(data).toBeDefined();
        expect(typeof data === "string").toBeTruthy();
        expect(data.trim() !== "").toBeTruthy();
      }
    );
  });

  test("getLatestRelease - url unknown", async () => {
    const githubRepo = `https://github.com/${crypto.randomUUID()}/${crypto.randomUUID()}`;
    await getLatestRelease(githubRepo)
      .then(() => {
        // unexpected
        expect(false).toBeTruthy();
      })
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  test("getLatestRelease - healthchecks filterAndReplace", async () => {
    const githubRepo = "https://github.com/healthchecks/healthchecks";
    await getLatestRelease(githubRepo, "^[v|V]([0-9.]+$)").then(
      (data: string) => {
        expect(data).toBeDefined();
        expect(typeof data === "string").toBeTruthy();
        expect(data.trim() !== "").toBeTruthy();
      }
    );
  });
});
