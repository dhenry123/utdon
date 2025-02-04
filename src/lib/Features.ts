/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { UptoDateOrNotState, UptodateForm } from "../Global.types";

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
