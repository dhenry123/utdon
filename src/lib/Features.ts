/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { getLatestRelease, getTypeGitRepo } from "./helperGitRepository";
import { filterJson, filterText } from "./helperProdVersionReader";
import { HTTPMethods, UptoDateOrNotState, UptodateForm } from "../Global.types";

export const scrapUrl = async (
  url: string,
  method: HTTPMethods = "GET",
  customHttpHeader?: string
): Promise<string> => {
  let authHeader: RequestInit = { method: method };
  const header = new Headers();
  if (customHttpHeader) {
    const split = customHttpHeader.split(":");
    if (split[1]) {
      header.append(split[0], split[1]);
      authHeader = { ...authHeader, headers: header };
    }
  }

  const content = await fetch(`${url}`, { ...authHeader }).then(
    async (response) => {
      if (!response.ok) {
        const message = `An error has occured: ${response.status}`;
        throw new Error(message);
      }
      // WARNING: (anti XSS) Content must never be interpreted by the browser
      const text = await response.text();
      return text;
    }
  );
  return content;
};

/**
 * return the object UptoDateOrNotState
 * @param sourceCodeVersion
 * @param productionVersion
 * @returns
 */
export const compareVersion = (
  name: string,
  sourceCodeVersion: string,
  productionVersion: string,
  urlGitHub: string,
  urlProduction: string
): UptoDateOrNotState => {
  let uptodateState = false,
    githubLatestReleaseIncludesProductionVersion = false,
    productionVersionIncludesGithubLatestRelease = false,
    strictlyEqual = false;
  // strict equality
  if (sourceCodeVersion === productionVersion) {
    uptodateState = true;
    strictlyEqual = true;
  } else {
    if (sourceCodeVersion.match(productionVersion)) {
      githubLatestReleaseIncludesProductionVersion = true;
      uptodateState = true;
    }
    if (productionVersion.match(sourceCodeVersion)) {
      productionVersionIncludesGithubLatestRelease = true;
      uptodateState = true;
    }
  }
  return {
    name: name,
    githubLatestRelease: sourceCodeVersion,
    productionVersion: productionVersion,
    state: uptodateState,
    strictlyEqual: strictlyEqual,
    githubLatestReleaseIncludesProductionVersion:
      githubLatestReleaseIncludesProductionVersion,
    productionVersionIncludesGithubLatestRelease:
      productionVersionIncludesGithubLatestRelease,
    urlGitHub: urlGitHub,
    urlProduction: urlProduction,
    ts: new Date().valueOf(),
  };
};

export const getUpToDateOrNotState = async (
  record: UptodateForm
): Promise<UptoDateOrNotState> => {
  // eslint-disable-next-line no-async-promise-executor
  return await new Promise(async (resolv, reject) => {
    try {
      // Getting production version
      const productionVersion = await scrapUrl(
        record.urlProduction,
        "GET",
        record.headerkey ? `${record.headerkey}:${record.headervalue}` : ""
      )
        .then(async (output) => {
          let version = "";
          if (record.scrapTypeProduction === "json") {
            version = filterJson(output as string, record.exprProduction || "");
          } else if (record.scrapTypeProduction === "text") {
            version = filterText(output as string, record.exprProduction || "");
          }
          return version;
        })
        .catch((error: Error) => {
          reject(new Error(`${error.toString()}-${record.urlProduction}`));
        });
      if (!productionVersion) {
        reject(
          new Error(
            "Impossible to detect Production version, check your settings"
          )
        );
      }
      // Getting Github version
      const githubVersion = await getLatestRelease(
        record.urlGitHub,
        getTypeGitRepo(record.urlGitHub),
        record.exprGithub,
        record.headerkeyGit
          ? `${record.headerkeyGit}:${record.headervalueGit}`
          : ""
      )
        .then((latest) => {
          return latest;
        })
        .catch((error) => {
          reject(error);
        });
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
    } catch (error) {
      reject(error);
    }
  });
};

/**
 *  order by outofdate, uptodatewithwarning, uptodate
 * @param rec
 * @returns
 */
export const recordsOrder = (rec: UptodateForm[]) => {
  const toUpdate: UptodateForm[] = [];
  const upTodateWithWarning: UptodateForm[] = [];
  const upTodate: UptodateForm[] = [];
  for (const item of rec) {
    if (item.compareResult && item.compareResult.ts) {
      if (item.compareResult.state && item.compareResult.strictlyEqual) {
        upTodate.push(item);
        continue;
      } else if (
        item.compareResult.state &&
        !item.compareResult.strictlyEqual
      ) {
        upTodateWithWarning.push(item);
        continue;
      }
    }
    toUpdate.push(item);
  }
  return toUpdate.concat(upTodateWithWarning).concat(upTodate);
};
