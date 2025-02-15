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
import { NODEJSVERSION } from "../Constants";

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
    if (process.env.PROXYCA_CERT) {
      caProxyCert = Buffer.from(process.env.PROXYCA_CERT, "base64").toString(
        "utf-8"
      );
    }
    let agent;
    if (httpsProxy && urlToTest.protocol === "https:") {
      httpRequestResponse.httpsProxy = true;
      agent = new HttpsProxyAgent(httpsProxy, {
        rejectUnauthorized: true, // CA certificates must be provided - next line
        ca: caProxyCert ? [caProxyCert] : undefined,
      });
    } else if (httpProxy && urlToTest.protocol === "http:") {
      httpRequestResponse.httpProxy = true;
      agent = new HttpProxyAgent(httpProxy);
    }
    const options = {
      method: method ? method : "GET",
      agent,
      keepAlive: false,
      headers: headers,
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
          res.resume(); // Consume the response data to free up memory
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
      let productionVersion: string | void = "";
      // fixed version
      if (record.fixed) {
        productionVersion = record.fixed;
      } else {
        // Getting production version
        productionVersion = await scrapUrlThroughProxy(
          record.urlProduction,
          "GET",
          record.headerkey ? `${record.headerkey}:${record.headervalue}` : ""
        )
          .then(async (output) => {
            let version = "";
            if (record.scrapTypeProduction === "json") {
              version = filterJson(
                output.data as string,
                record.exprProduction || ""
              );
            } else if (record.scrapTypeProduction === "text") {
              version = filterText(
                output.data as string,
                record.exprProduction || ""
              );
            }
            return version;
          })
          .catch((error: Error) => {
            reject(new Error(`${error.toString()}-${record.urlProduction}`));
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
          : ""
      )
        .then((response) => {
          const githubVersion = getLatestRelease(
            getTypeGitRepo(record.urlGitHub),
            response.data,
            record.exprGithub
          );
          // Compare versions
          resolv(
            compareVersion(
              record.name,
              githubVersion || "",
              productionVersion || "",
              record.urlGitHub || "",
              record.urlProduction || ""
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
