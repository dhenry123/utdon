/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  getLatestRelease,
  getGitUrlTagReleases,
  getTypeGitRepo,
  filterAndReplace,
  selectLatestTag,
} from "../src/lib/helperGitRepository";
import crypto from "crypto";
import { readFileSync } from "fs";
import { scrapUrlThroughProxy } from "../src/lib/scrapUrlServer";
import { InfosScrapConnection, TypeGitRepo } from "../src/Global.types";
import http from "http";
import { HTTPREQUESTTIMEOUT } from "../src/Constants";

describe("helperGitRepository", () => {
  describe("getGitUrlTagReleases", () => {
    test("getGitUrlTagReleases - github", () => {
      const url = getGitUrlTagReleases(
        "https://github.com/dhenry123/utdon",
        "github"
      );
      expect(url).toEqual("https://api.github.com/repos/dhenry123/utdon/releases");
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
  });

  describe("getTypeGitRepo", () => {
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
  });

  describe("getGitUrlTagReleases", () => {
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

    test("scrap url - error timeout expired", async () => {
      // Create server
      const server = http.createServer((req, res) => {
        // Simulate a delay (e.g., 10 seconds)
        setTimeout(() => {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Response after delay");
        }, HTTPREQUESTTIMEOUT + 1000); // code HTTPREQUESTTIMEOUT value + 2000
      });
      // Start the server
      const PORT = 27055;
      server.listen(PORT, () => {
        console.log(`Mock server is running at http://localhost:${PORT}`);
      });
      const gitRepo = `http://localhost:${PORT}`;
      await scrapUrlThroughProxy(getGitUrlTagReleases(gitRepo, "gitea"), "GET")
        .then((response: InfosScrapConnection) => {
          console.log(response);
          // not expected
          expect(true).toBeFalsy();
        })
        .catch((error) => {
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(/timeout!/);
          server.close();
          return;
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

    test("getLatestRelease - No filter utdon (github) ", async () => {
      const gitRepo = "https://github.com/dhenry123/utdon";
      const typeRepo: TypeGitRepo = "github";
      await scrapUrlThroughProxy(
        getGitUrlTagReleases(gitRepo, typeRepo),
        "GET"
      ).then((response: InfosScrapConnection) => {
        const data = getLatestRelease(typeRepo, response.data, "");
        expect(data).toBeDefined();
        expect(typeof data === "string").toBeTruthy();
        expect(data.trim() !== "").toBeTruthy();
      });
    });

    test("getLatestRelease - GitHub specification changes ", async () => {
      const typeRepo: TypeGitRepo = "github";
      const data = getLatestRelease(typeRepo, '{"change":true}', "^[0-9.]+$");
      // console.log(data);
      expect(data).toBeDefined();
      expect(typeof data === "string").toBeTruthy();
      expect(data.trim() == "").toBeTruthy();
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

  describe("filterAndReplace", () => {
    const filtered = ["v10.0.1", "v7.0.13", "v10.0.0", "v9.0.3", "v7.0.12"];

    test("filterAndReplace - no replace in regExp ", () => {
      const filtersName = "^v[0-9.]+$";
      const result = filterAndReplace(filtersName, filtered);
      // console.log(result);
      expect(result).toEqual(filtered[0]);
    });
    test("filterAndReplace - replace in regExp ", () => {
      const filtersName = "^v([0-9.]+)$";
      const result = filterAndReplace(filtersName, filtered);
      // console.log(result);
      expect(result).toEqual(filtered[0].replace(/v([0-9.]+)$/, "$1"));
    });
  });

  describe("getLatestRelease - semver ordering (issue #26)", () => {
    // offline fixture modeled on the VictoriaLogs releases API response:
    // the v1.51.1 backport was created AFTER v1.52.0, so the API (ordered
    // by internal id) lists it first — the greatest tag is NOT entry [0]
    const outOfOrder = readFileSync(
      `${process.cwd()}/test/samples/releases-out-of-order.json`,
      "utf-8"
    );

    test("getLatestRelease - no filter - returns the greatest tag, not the first", () => {
      expect(getLatestRelease("github", outOfOrder, "")).toEqual("v1.52.0");
    });

    test("getLatestRelease - filter without capture - greatest matching tag", () => {
      expect(getLatestRelease("github", outOfOrder, "^v[0-9.]+$")).toEqual(
        "v1.52.0"
      );
    });

    test("getLatestRelease - filter with capture - greatest after $1 substitution", () => {
      expect(getLatestRelease("github", outOfOrder, "^v([0-9.]+)$")).toEqual(
        "1.52.0"
      );
    });

    test("getLatestRelease - gitea - same ordering", () => {
      expect(getLatestRelease("gitea", outOfOrder, "")).toEqual("v1.52.0");
    });

    test("getLatestRelease - non semver tags - falls back to first entry", () => {
      const tags = JSON.stringify([
        { tag_name: "stable" },
        { tag_name: "nightly" },
      ]);
      expect(getLatestRelease("github", tags, "")).toEqual("stable");
    });

    test("getLatestRelease - numeric fields compared numerically", () => {
      // a string comparison would wrongly rank v1.2.0 above v1.10.0
      const tags = JSON.stringify([
        { tag_name: "v1.2.0" },
        { tag_name: "v1.10.0" },
      ]);
      expect(getLatestRelease("github", tags, "")).toEqual("v1.10.0");
    });
  });

  describe("selectLatestTag", () => {
    test("selectLatestTag - greatest tag, not first", () => {
      expect(selectLatestTag(["v10.0.1", "v10.0.2", "v9.0.3"])).toEqual(
        "v10.0.2"
      );
    });

    test("selectLatestTag - filter scopes candidates then picks greatest", () => {
      // first-match behavior would return v1.9.0
      expect(selectLatestTag(["v1.9.0", "v1.9.5", "v2.1.0"], "^v1\\.")).toEqual(
        "v1.9.5"
      );
    });

    test("selectLatestTag - filter with capture substitution", () => {
      expect(
        selectLatestTag(
          ["v1.9.0-lts", "v1.9.5-lts", "v2.1.0"],
          "^v(1\\.9\\.[0-9]+)-lts$"
        )
      ).toEqual("1.9.5");
    });

    test("selectLatestTag - empty list", () => {
      expect(selectLatestTag([])).toEqual("");
    });

    test("selectLatestTag - no match with filter", () => {
      expect(selectLatestTag(["v1.0.0"], "^x")).toEqual("");
    });

    test("selectLatestTag - non semver falls back to first", () => {
      expect(selectLatestTag(["stable", "nightly"])).toEqual("stable");
    });
  });
});
