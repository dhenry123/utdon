import {
  isProxyRequired,
  scrapUrlThroughProxy,
} from "../src/lib/scrapUrlServer";

/**
 * Jestconfig: autoload proxy info from ./.envTest
 * eg:
 * # No ssl proxy - proxy use CONNECT method
 * HTTP_PROXY='http://192.168.1.1:8080'
 * HTTPS_PROXY='http://192.168.1.1:8080'
 * # With ssl proxy CA certificate must be set && url proxy must start with https
 * PROXYCA_CERT="Base64 encoded ca-cert.pem)" eg: PROXYCA_CERT="LS0t...."
 * INTSSLHTTPS_PROXY="https://proxy.mydomain:8083"
 */

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

    test("scrapUrlThroughProxy - default With HTTPS_PROXY = HTTP_PROXY - no header - will use proxy ", async () => {
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

    test("scrapUrlThroughProxy - default With HTTP_PROXY - no header - will use proxy ", async () => {
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

    test("scrapUrlThroughProxy - default With HTTPS_PROXY (ssl) & HTTP_PROXY - no header - will use proxy ", async () => {
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
});
