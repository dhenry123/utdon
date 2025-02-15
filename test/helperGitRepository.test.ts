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
import { scrapUrlThroughProxy } from "../src/lib/scrapUrlServer";
import { InfosScrapConnection, TypeGitRepo } from "../src/Global.types";

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
    await scrapUrlThroughProxy(
      getGitUrlTagReleases(gitRepo, "github"),
      "GET"
    ).then((response: InfosScrapConnection) => {
      expect(response).toBeDefined();
      const json = JSON.parse(response.data);
      expect(Array.isArray(json)).toBeTruthy();
      expect(json.length).toBeGreaterThan(0);
    });
  });

  test("scrap Gitea tags - url ok", async () => {
    const gitRepo = "https://codeberg.org/forgejo/forgejo";
    await scrapUrlThroughProxy(
      getGitUrlTagReleases(gitRepo, "gitea"),
      "GET"
    ).then((response: InfosScrapConnection) => {
      expect(response).toBeDefined();
      const json = JSON.parse(response.data);
      expect(Array.isArray(json)).toBeTruthy();
      expect(json.length).toBeGreaterThan(0);
    });
  });

  test("scrap Github tags - wrong url", async () => {
    const gitRepo = `https://github.com/${crypto.randomUUID()}/${crypto.randomUUID()}`;
    await scrapUrlThroughProxy(getGitUrlTagReleases(gitRepo, "github"), "GET")
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
    await scrapUrlThroughProxy(getGitUrlTagReleases(gitRepo, "gitea"), "GET")
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
    const typeRepo: TypeGitRepo = "github";
    await scrapUrlThroughProxy(
      getGitUrlTagReleases(gitRepo, typeRepo),
      "GET"
    ).then((response: InfosScrapConnection) => {
      const data = getLatestRelease(typeRepo, response.data, "^[0-9.]+$");
      // console.log(data);
      expect(data).toBeDefined();
      expect(typeof data === "string").toBeTruthy();
      expect(data.trim() !== "").toBeTruthy();
    });
  });

  test("getLatestRelease - forgejo (gitea) ", async () => {
    const gitRepo = "https://codeberg.org/forgejo/forgejo";
    const typeRepo: TypeGitRepo = "gitea";
    await scrapUrlThroughProxy(
      getGitUrlTagReleases(gitRepo, typeRepo),
      "GET"
    ).then((response: InfosScrapConnection) => {
      const data = getLatestRelease(typeRepo, response.data, "^v[0-9.]+$");
      expect(data).toBeDefined();
      expect(typeof data === "string").toBeTruthy();
      expect(data.trim() !== "").toBeTruthy();
    });
  });
});
