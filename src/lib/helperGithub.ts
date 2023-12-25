/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { scrapUrl } from "./Features";

export const getGithubTagsurl = (githubRepo: string) => {
  const githubApiReleasesEntry = "https://api.github.com/repos";
  const regExpExtractDomain = "^https?:\\/\\/[^@\\/\n]+\\/";
  const owner = githubRepo.replace(new RegExp(regExpExtractDomain), "");
  return `${githubApiReleasesEntry}/${owner}/tags`;
};

/**
 * common server && UI
 * @param filtersName
 * @param filtered
 * @returns
 */
export const filterAndReplace = (
  filtersName: string,
  filtered: string[]
): string => {
  if (filtersName && filtersName.match(/\(/)) {
    return filtered[0].replace(new RegExp(filtersName), "$1");
  } else {
    return filtered[0];
  }
};

export const getLatestRelease = async (
  url: string,
  filtersName?: string
): Promise<string> => {
  return await scrapUrl(getGithubTagsurl(url), "GET")
    .then((releaseTags: unknown) => {
      const json = JSON.parse(releaseTags as string);
      if (json && Array.isArray(json)) {
        const filtered: string[] = json
          .filter((item) => item.name.match(filtersName))
          .map((item) => item?.name as string);
        if (filtered.length > 0 && filtersName) {
          return filterAndReplace(filtersName, filtered);
        }
      }
      // if Github change specifications ???? - hard to test
      // trying with an other domain return 404
      return "";
    })
    .catch((error) => {
      throw error;
    });
};
