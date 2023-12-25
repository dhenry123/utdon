/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  compareVersion,
  getUpToDateOrNotState,
  scrapUrl,
} from "../src/lib/Features";

describe("Features", () => {
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

  test("scrapUrl - default GET", async () => {
    const content = await scrapUrl("https://www.google.com")
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.log(error);
        //unexpected --> google is dead ???
        expect(false).toBeTruthy();
      });
    expect(content).not.toEqual("");
  });

  test("scrapUrl - POST", async () => {
    const content = await scrapUrl("https://www.google.com", "POST")
      .then((result) => {
        console.log(result);
        //unexpected --> google allow POST on root path  ???
        expect(false).toBeTruthy();
      })
      .catch((error) => {
        expect(error.toString()).toMatch(/An error has occured: 405/);
      });
    expect(content).not.toEqual("");
  });

  test("scrapUrl - default GET With authent", async () => {
    const content = await scrapUrl(
      "https://www.google.com",
      "GET",
      "Bearer xxxxxxxxx"
    )
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.log(error);
        //unexpected --> google is dead ???
        expect(false).toBeTruthy();
      });
    expect(content).not.toEqual("");
  });

  /**
   * Warn i ve used Immich because they expose a demo website
   * but immich demo could be down...
   */
  test("getUpToDateOrNotState - Work only if demo immich website is up - no actions", async () => {
    const name = "Demo Immich";
    const content = await getUpToDateOrNotState({
      urlProduction: "https://demo.immich.app/api/server-info/version",
      scrapTypeProduction: "json",
      exprProduction: "{prefix: 'v',test:join('.',*)}|join('',*)",
      urlGitHub: "https://github.com/immich-app/immich",
      exprGithub: "^[v|V][0-9\\.]+$",
      urlCronJobMonitoring: "",
      urlCronJobMonitoringAuth: "",
      urlCICD: "",
      urlCICDAuth: "",
      uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      name: name,
      httpMethodCICD: "GET",
      logo: "",
      httpMethodCronJobMonitoring: "GET",
      isPause: true,
      compareResult: null,
    })
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.log(error);
        expect(false).toBeTruthy();
      });

    if (content) {
      expect(typeof content).toEqual("object");
      expect(content.name).toEqual(name);
      expect(content.ts).toBeGreaterThan(0);
      expect(content.githubLatestRelease).not.toEqual("");
      expect(content.productionVersion).not.toEqual("");
    } else {
      console.log(content);
      expect(false).toBeTruthy();
    }
  });
});
