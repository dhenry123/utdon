import {
  HTTPMethods,
  InfosScrapConnection,
  JSONLang,
  UptodateForm,
  UptoDateOrNotState,
} from "../Global.types";
import https from "https";
import http from "http";

import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { compareVersion } from "./Features";
import {
  getGitUrlTagReleases,
  getLatestRelease,
  getTypeGitRepo,
} from "./helperGitRepository";
import { filterJson, filterText } from "./helperProdVersionReader";
import { HTTPREQUESTTIMEOUT, NODEJSVERSION } from "../Constants";
import { existsSync, readFileSync } from "fs";

export const isProxyRequired = (url: string, envNoProxy: string): boolean => {
  if (!envNoProxy.trim()) return true;
  // Split on , and " "
  const items = envNoProxy.replace(/,/g, " ").split(" ");
  const urlObject = new URL(url);
  for (const item of items) {
    if (!item.trim()) continue;
    const regExp = new RegExp(item.trim().replace(/\*/g, ""));
    if (regExp.test(urlObject.host)) {
      return false;
    }
  }
  return true;
};

export const scrapUrlThroughProxy = async (
  url: string,
  method: HTTPMethods,
  customHttpHeader?: string,
  httpProxy?: string,
  httpsProxy?: string
): Promise<InfosScrapConnection> => {
  return new Promise((resolve, reject) => {
    const httpRequestResponse: InfosScrapConnection = {
      httpProxy: false,
      httpsProxy: false,
      data: "",
    };
    const headers: JSONLang = {
      "User-Agent": `Node.js/${NODEJSVERSION} (Linux)`,
    };
    if (customHttpHeader) {
      const split = customHttpHeader.split(":");
      if (split[1]) {
        headers[split[0]] = split[1];
      }
    }
    const urlToTest = new URL(url);
    let caProxyCert;
    if (httpsProxy && process.env.PROXYCA_CERT) {
      const cacertsDir = `${process.cwd()}/cacerts`;
      const cacertsPath = `${cacertsDir}/${process.env.PROXYCA_CERT}`;
      if (existsSync(`${cacertsPath}`)) {
        caProxyCert = readFileSync(cacertsPath, "utf-8");
      } else {
        throw new Error(
          `The ca certificate name provided in the environment variable PROXYCA_CERT doesn't exist in ${cacertsDir}, create the file or import it`
        );
      }
    }
    let agent;
    if (httpsProxy && urlToTest.protocol === "https:") {
      httpRequestResponse.httpsProxy = true;
      agent = new HttpsProxyAgent(httpsProxy, {
        rejectUnauthorized:
          process.env.NODE_TLS_REJECT_UNAUTHORIZED == "0" ? false : true,
        ca: caProxyCert ? [caProxyCert] : undefined,
        timeout: HTTPREQUESTTIMEOUT,
      });
    } else if (httpProxy && urlToTest.protocol === "http:") {
      httpRequestResponse.httpProxy = true;
      agent = new HttpProxyAgent(httpProxy, { timeout: HTTPREQUESTTIMEOUT });
    }
    const options = {
      method: method,
      agent,
      keepAlive: false,
      headers: headers,
      timeout: HTTPREQUESTTIMEOUT,
    };

    let str = "";

    const httpRequestHandler = (res: http.IncomingMessage) => {
      res.on("data", function (chunk) {
        str += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(
            new Error(
              `Request failed with status code ${
                res.statusCode
              } - data received:\n${str.toString()}\n`
            )
          );
          res.destroy();
          return;
        }
        resolve({ ...httpRequestResponse, data: str.toString() });
      });
    };
    let req;
    if (urlToTest.protocol === "https:") {
      req = https.request(url, options, (res) => {
        httpRequestHandler(res);
      });
    } else {
      req = http.request(url, options, (res) => {
        httpRequestHandler(res);
      });
    }

    req.on("timeout", function () {
      reject(new Error(`timeout! ${options.timeout / 1000} seconds expired`));
      req.destroy();
    });

    req.on("error", (e) => {
      reject(new Error(`Problem with request: ${e.message}`));
    });

    req.end();
  });
};

export const getUpToDateOrNotState = async (
  record: UptodateForm
): Promise<UptoDateOrNotState> => {
  // eslint-disable-next-line no-async-promise-executor
  return await new Promise(async (resolv, reject) => {
    try {
      let productionVersion: string;
      // fixed version
      if (record.fixed) {
        productionVersion = record.fixed;
      } else {
        // Getting production version
        productionVersion = await scrapUrlThroughProxy(
          record.urlProduction,
          "GET",
          record.headerkey ? `${record.headerkey}:${record.headervalue}` : "",
          process.env.HTTP_PROXY,
          process.env.HTTPS_PROXY
        )
          .then(async (output: InfosScrapConnection) => {
            let version = "";
            if (record.scrapTypeProduction === "json") {
              version = filterJson(
                output.data as string,
                record.exprProduction
              );
            } else if (record.scrapTypeProduction === "text") {
              version = filterText(
                output.data as string,
                record.exprProduction
              );
            }
            return version;
          })
          .catch((error: Error) => {
            reject(new Error(`${error.toString()}-${record.urlProduction}`));
            return "";
          });
      }
      if (!productionVersion) {
        reject(
          new Error(
            "Impossible to detect Production version, check your settings"
          )
        );
      }
      // Getting Github version
      await scrapUrlThroughProxy(
        getGitUrlTagReleases(
          record.urlGitHub,
          getTypeGitRepo(record.urlGitHub)
        ),
        "GET",
        record.headerkeyGit
          ? `${record.headerkeyGit}:${record.headervalueGit}`
          : "",
        process.env.HTTP_PROXY,
        process.env.HTTPS_PROXY
      )
        .then((response: InfosScrapConnection) => {
          const githubVersion = getLatestRelease(
            getTypeGitRepo(record.urlGitHub),
            response.data,
            record.exprGithub
          );
          // Compare versions
          resolv(
            compareVersion(
              record.name,
              githubVersion,
              productionVersion,
              record.urlGitHub,
              record.urlProduction
            )
          );
        })
        .catch((error) => {
          throw error;
        });
    } catch (error) {
      reject(error);
    }
  });
};
