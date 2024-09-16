/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  getLatestRelease,
  getGitUrlTagReleases,
  getTypeGitRepo,
} from "../src/lib/helperGitRepository";
import crypto from "crypto";
import { scrapUrl } from "../src/lib/Features";

describe("helperGitRepository", () => {
  test("getGitUrlTagReleases - github", () => {
    const url = getGitUrlTagReleases(
      "https://github.com/dhenry123/utdon",
      "github"
    );
    expect(url).toEqual("https://api.github.com/repos/dhenry123/utdon/tags");
  });

  test("getGitUrlTagReleases - gitea", () => {
    const url = getGitUrlTagReleases(
      "https://codeberg.org/forgejo/forgejo",
      "gitea"
    );
    expect(url).toEqual(
      "https://codeberg.org/api/v1/repos/forgejo/forgejo/releases"
    );
  });

  test("getTypeGitRepo - github", () => {
    expect(getTypeGitRepo("https://github.com/dhenry123/utdon")).toEqual(
      "github"
    );
  });
  test("getTypeGitRepo - gitea", () => {
    expect(getTypeGitRepo("https://codeberg.org/forgejo/forgejo")).toEqual(
      "gitea"
    );
  });
  // For the moment :)
  test("getTypeGitRepo - other is GITEA !!!", () => {
    expect(getTypeGitRepo("https://www.google.com")).toEqual("gitea");
  });

  test("scrap Github tags - url ok", async () => {
    const gitRepo = "https://github.com/dhenry123/utdon";
    await scrapUrl(getGitUrlTagReleases(gitRepo, "github"), "GET").then(
      (data: string) => {
        expect(data).toBeDefined();
        const json = JSON.parse(data);
        expect(Array.isArray(json)).toBeTruthy();
        expect(json.length).toBeGreaterThan(0);
      }
    );
  });

  test("scrap Gitea tags - url ok", async () => {
    const gitRepo = "https://codeberg.org/forgejo/forgejo";
    await scrapUrl(getGitUrlTagReleases(gitRepo, "gitea"), "GET").then(
      (data: string) => {
        expect(data).toBeDefined();
        const json = JSON.parse(data);
        expect(Array.isArray(json)).toBeTruthy();
        expect(json.length).toBeGreaterThan(0);
      }
    );
  });

  test("scrap Github tags - wrong url", async () => {
    const gitRepo = `https://github.com/${crypto.randomUUID()}/${crypto.randomUUID()}`;
    await scrapUrl(getGitUrlTagReleases(gitRepo, "github"), "GET")
      .then(() => {
        // unexpected
        expect(false).toBeTruthy();
      })
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  test("scrap Gitea tags - wrong url", async () => {
    const gitRepo = `https://codeberg.org/${crypto.randomUUID()}/${crypto.randomUUID()}`;
    await scrapUrl(getGitUrlTagReleases(gitRepo, "gitea"), "GET")
      .then(() => {
        // unexpected
        expect(false).toBeTruthy();
      })
      .catch((error) => {
        expect(error).toBeDefined();
      });
  });

  test("getLatestRelease - utdon (github) ", async () => {
    const gitRepo = "https://github.com/dhenry123/utdon";
    await getLatestRelease(gitRepo, "github", "^[0-9.]+$").then(
      (data: string) => {
        expect(data).toBeDefined();
        expect(typeof data === "string").toBeTruthy();
        expect(data.trim() !== "").toBeTruthy();
      }
    );
  });

  test("getLatestRelease - forgejo (gitea) ", async () => {
    const gitRepo = "https://codeberg.org/forgejo/forgejo";
    await getLatestRelease(gitRepo, "gitea", "^v[0-9.]+$").then(
      (data: string) => {
        expect(data).toBeDefined();
        expect(typeof data === "string").toBeTruthy();
        expect(data.trim() !== "").toBeTruthy();
      }
    );
  });
});
