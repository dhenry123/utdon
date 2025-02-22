import {
  getUpToDateOrNotState,
  isProxyRequired,
  scrapUrlThroughProxy,
} from "../src/lib/scrapUrlServer";

/**
 * Jestconfig: autoload proxy info from ./.envTest see ./.envTest-sample
 */

// set cacerts path for tests
process.env.NODE_EXTRA_CA_CERTS = `${process.cwd()}/tests/cacerts`;
const domainNotFound = "www.mydomain.notfound";

describe("scrapUrlServer", () => {
  describe("isProxyRequired", () => {
    test("isProxyRequired - NO_PROXY empty - Proxy required", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeTruthy();
    });
    test("isProxyRequired - NO_PROXY match - No proxy", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "www.mytinydc.com";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeFalsy();
    });
    test("isProxyRequired - NO_PROXY match * - No proxy", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "*.mytinydc.com";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeFalsy();
    });
    test("isProxyRequired - NO_PROXY not match - Proxy required", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "192.168.0.1";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeTruthy();
    });
    test("isProxyRequired - NO_PROXY match Ip address - No proxy", () => {
      const url = "https://192.168.0.1";
      const envNoProxy = "192.168.0.1";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeFalsy();
    });
    test("isProxyRequired - NO_PROXY match Ip address:port - No proxy", () => {
      const url = "https://192.168.0.1:8080";
      const envNoProxy = "192.168.0.1";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeFalsy();
    });
    test("isProxyRequired - NO_PROXY match Ip address:port - No proxy", () => {
      const url = "https://192.168.0.1:8081";
      const envNoProxy = "192.168.0.1:8081";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeFalsy();
    });
    test("isProxyRequired - NO_PROXY not match Ip address:port - Proxy required", () => {
      const url = "https://192.168.0.1:8081";
      const envNoProxy = "192.168.0.1:8080";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeTruthy();
    });
    test("isProxyRequired - NO_PROXY not match List comma separator- Proxy required", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "192.168.0.1:8080, *.test.com";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeTruthy();
    });
    test("isProxyRequired - NO_PROXY not match List space separator - Proxy required", () => {
      const url = "https://www.mytinydc.com";
      const envNoProxy = "192.168.0.1:8080 *.test.com";
      const result = isProxyRequired(url, envNoProxy);
      expect(result).toBeTruthy();
    });
  });
  describe("scrapUrlThroughProxy", () => {
    beforeEach(() => {
      process.env.BCKPROXYCA_CERT = process.env.PROXYCA_CERT;
      process.env.BCKNODE_TLS_REJECT_UNAUTHORIZED =
        process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    });
    afterEach(() => {
      process.env.PROXYCA_CERT = process.env.BCKPROXYCA_CERT;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED =
        process.env.BCKNODE_TLS_REJECT_UNAUTHORIZED;
    });

    test("scrapUrlThroughProxy - url not found - no proxy set - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy(
        `http://${domainNotFound}`,
        "GET"
      )
        .then((result) => {
          console.log(result);
          //unexpected
          expect(false).toBeTruthy();
        })
        .catch((error) => {
          // console.log(error);
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(
            new RegExp(`Error.*${domainNotFound}.*`)
          );
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default GET http - no proxy set - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy("http://www.google.com", "GET")
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default GET http - no proxy set - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy("http://www.google.com", "GET")
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default GET https - no proxy set - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET"
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default With HeaderGET - no proxy set - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "Authorization:xxxxxxx"
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default With HTTP_PROXY - https request - will not use proxy", async () => {
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default With HTTPS_PROXY = HTTP_PROXY - no header - will use proxy", async () => {
      // console.log(process.env.HTTP_PROXY, process.env.HTTPS_PROXY);
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY,
        process.env.HTTPS_PROXY
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeTruthy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default With HTTP_PROXY - no header - will use proxy", async () => {
      // console.log(
      //   process.env.HTTP_PROXY,
      //   process.env.INTSSLHTTPS_PROXY,
      //   process.env.PROXYCA_CERT
      // );
      const content = await scrapUrlThroughProxy(
        "http://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY
      )
        .then((result) => {
          expect(result.httpProxy).toBeTruthy();
          expect(result.httpsProxy).toBeFalsy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default With HTTPS_PROXY (ssl) - CA Cert not found", async () => {
      process.env.PROXYCA_CERT = "notfound.ca";
      // console.log(
      //   process.env.HTTP_PROXY,
      //   process.env.INTSSLHTTPS_PROXY,
      //   process.env.PROXYCA_CERT
      // );
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY,
        process.env.INTSSLHTTPS_PROXY
      )
        .then((result) => {
          //unexpected
          console.log(result);
          expect(true).toBeFalsy();
        })
        .catch((error) => {
          // console.log(error);
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(
            /The ca certificate name provided in the environment variable PROXYCA_CERT/
          );
        });
      expect(content).not.toBeDefined();
    });

    test("scrapUrlThroughProxy - default With HTTPS_PROXY (ssl) - CA Cert not provided", async () => {
      process.env.PROXYCA_CERT = "";
      // console.log(
      //   process.env.HTTP_PROXY,
      //   process.env.INTSSLHTTPS_PROXY,
      //   process.env.PROXYCA_CERT
      // );
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY,
        process.env.INTSSLHTTPS_PROXY
      )
        .then((result) => {
          //unexpected
          console.log(result);
          expect(true).toBeFalsy();
        })
        .catch((error) => {
          // console.log(error);
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(
            /self-signed certificate in certificate chain/
          );
        });
      expect(content).not.toBeDefined();
    });

    test("scrapUrlThroughProxy - default With HTTPS_PROXY (ssl) - ssl check disabled by admin - CA Cert not provided", async () => {
      process.env.PROXYCA_CERT = "";
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      // console.log(
      //   process.env.HTTP_PROXY,
      //   process.env.INTSSLHTTPS_PROXY,
      //   process.env.PROXYCA_CERT
      // );
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY,
        process.env.INTSSLHTTPS_PROXY
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeTruthy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).toBeDefined();
    });

    test("scrapUrlThroughProxy - default With HTTPS_PROXY (ssl) & HTTP_PROXY - no header - will use proxy", async () => {
      // console.log(
      //   process.env.HTTP_PROXY,
      //   process.env.INTSSLHTTPS_PROXY,
      //   process.env.PROXYCA_CERT
      // );
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "",
        process.env.HTTP_PROXY,
        process.env.INTSSLHTTPS_PROXY
      )
        .then((result) => {
          expect(result.httpProxy).toBeFalsy();
          expect(result.httpsProxy).toBeTruthy();
          expect(result.data).toMatch(/google/i);
          // console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          //unexpected --> google is dead ???
          expect(false).toBeTruthy();
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - POST must return http code 405 (POST not authorized on google:/) - no proxy", async () => {
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "POST"
      )
        .then((result) => {
          console.log(result);
          //unexpected --> google allow POST on root path  ???
          expect(false).toBeTruthy();
        })
        .catch((error) => {
          expect(error.toString()).toMatch(
            /Request failed with status code 40/
          );
        });
      expect(content).not.toEqual("");
    });

    test("scrapUrlThroughProxy - default GET With authent", async () => {
      const content = await scrapUrlThroughProxy(
        "https://www.google.com",
        "GET",
        "xxxxxxxxx"
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
  });
  describe("getUpToDateOrNotState", () => {
    /**
     * Warn i ve used Immich because they expose a demo website
     * but immich demo could be down...
     */
    test("getUpToDateOrNotState - Work only if demo immich website is up - no actions", async () => {
      const name = "Demo Immich";
      const content = await getUpToDateOrNotState({
        urlProduction: "https://demo.immich.app/api/server/version",
        headerkey: "",
        headervalue: "",
        headerkeyGit: "",
        headervalueGit: "",
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
        groups: [],
        typeRepo: "github",
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

    test("getUpToDateOrNotState - Fake header for production url Work only if demo immich website is up - no actions", async () => {
      const name = "Demo Immich";
      const content = await getUpToDateOrNotState({
        urlProduction: "https://demo.immich.app/api/server/version",
        headerkey: "Authorization",
        headervalue: "xxxxx",
        headerkeyGit: "",
        headervalueGit: "",
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
        groups: [],
        typeRepo: "github",
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

    // For this test you must set value for GITHUBTOKEN = [Your github token]
    test("getUpToDateOrNotState - GitHub header autorization Work only if demo immich website is up - no actions", async () => {
      const name = "Demo Immich";
      const content = await getUpToDateOrNotState({
        urlProduction: "https://demo.immich.app/api/server/version",
        headerkey: "",
        headervalue: "",
        headerkeyGit: "Authorization",
        headervalueGit: `Bearer ${process.env.GITHUBTOKEN}`,
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
        groups: [],
        typeRepo: "github",
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

    test("getUpToDateOrNotState - Production version fixed value - no actions", async () => {
      const name = "Demo Immich";
      const content = await getUpToDateOrNotState({
        urlProduction: "",
        fixed: "v1.126.1",
        headerkey: "",
        headervalue: "",
        headerkeyGit: "",
        headervalueGit: "",
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
        groups: [],
        typeRepo: "github",
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

    test("getUpToDateOrNotState - Production scrap type: text - no actions", async () => {
      const name = "Demo Immich";
      const content = await getUpToDateOrNotState({
        urlProduction: "https://demo.immich.app/api/server/version",
        headerkey: "",
        headervalue: "",
        headerkeyGit: "",
        headervalueGit: "",
        scrapTypeProduction: "text",
        exprProduction: "^.*([0-9]+)",
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
        groups: [],
        typeRepo: "github",
      })
        .then((result) => {
          // console.log(result);
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

    test("getUpToDateOrNotState - Github url not found - no actions", async () => {
      process.env.HTTP_PROXY = "";
      process.env.HTTPS_PROXY = "";

      const name = "Demo Immich";
      await getUpToDateOrNotState({
        urlProduction: "https://demo.immich.app/api/server/version",
        headerkey: "",
        headervalue: "",
        headerkeyGit: "",
        headervalueGit: "",
        scrapTypeProduction: "json",
        exprProduction: "{prefix: 'v',test:join('.',*)}|join('',*)",
        urlGitHub: `https://${domainNotFound}/immich-app/immich`,
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
        groups: [],
        typeRepo: "github",
      })
        .then((result) => {
          console.log(result);
          //unexpected
          expect(false).toBeTruthy();
        })
        .catch((error) => {
          // console.log(error);
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(
            new RegExp(`.*${domainNotFound}.*`)
          );
        });
    });

    test("getUpToDateOrNotState - Production url not found", async () => {
      process.env.HTTP_PROXY = "";
      process.env.HTTPS_PROXY = "";

      const name = "Not Found";
      await getUpToDateOrNotState({
        urlProduction: `https://${domainNotFound}`,
        headerkey: "",
        headervalue: "",
        headerkeyGit: "",
        headervalueGit: "",
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
        groups: [],
        typeRepo: "github",
      })
        .then((result) => {
          console.log(result);
          //unexpected
          expect(false).toBeTruthy();
        })
        .catch((error) => {
          // console.log(error);
          expect(error).toBeDefined();
          expect((error as Error).toString()).toMatch(
            new RegExp(`.*${domainNotFound}.*`)
          );
        });
    });
  });
});
