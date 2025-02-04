import axios from "axios";
import {
  HTTPMethods,
  JSONLang,
  UptodateForm,
  UptoDateOrNotState,
} from "../Global.types";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { compareVersion } from "./Features";
import {
  getGitUrlTagReleases,
  getLatestRelease,
  getTypeGitRepo,
} from "./helperGitRepository";
import { filterJson, filterText } from "./helperProdVersionReader";

export const scrapUrlThroughProxy = async (
  url: string,
  method: HTTPMethods = "GET",
  customHttpHeader?: string
): Promise<string> => {
  const headers: JSONLang = {};
  if (customHttpHeader) {
    const split = customHttpHeader.split(":");
    if (split[1]) {
      headers[split[0]] = split[1];
    }
  }

  const options = {
    method: method,
    url: url,
    headers,
  };
  if (process.env && process.env.HTTP_PROXY) {
    const proxyUrlHttp = process.env.HTTP_PROXY;
    const proxyUrlHttps = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    const response = await axios({
      ...options,
      httpAgent: new HttpProxyAgent(proxyUrlHttp),
      httpsAgent: new HttpsProxyAgent(proxyUrlHttps),
    });
    // AS STRING important
    return JSON.stringify(response.data);
  } else {
    const response = await axios(options);
    // AS STRING important
    return JSON.stringify(response.data);
  }
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
                output as string,
                record.exprProduction || ""
              );
            } else if (record.scrapTypeProduction === "text") {
              version = filterText(
                output as string,
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
        .then((releaseTags) => {
          const githubVersion = getLatestRelease(
            getTypeGitRepo(record.urlGitHub),
            releaseTags,
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
