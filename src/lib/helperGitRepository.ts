/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  GiteaReleaseTagModel,
  GithubReleaseTagModel,
  TypeGitRepo,
} from "../Global.types";
import { scrapUrl } from "./Features";

export const getGitUrlTagReleases = (gitRepoUrl: string, typeRepo: string) => {
  if (typeRepo === "github") {
    const githubApiReleasesEntry = "https://api.github.com/repos";
    const regExpExtractDomain = "^https?:\\/\\/[^@\\/\n]+\\/";
    const owner = gitRepoUrl.replace(new RegExp(regExpExtractDomain), "");
    return `${githubApiReleasesEntry}/${owner}/tags`;
  } else {
    //Gitea other solution
    //xxxxDOMAINxxx/api/v1/repos/xxxOWNERxxx/releases
    const regExp = "(^https?:\\/\\/[^@\\/\n]+\\/)(.*)";
    return gitRepoUrl.replace(new RegExp(regExp), "$1api/v1/repos/$2/releases");
  }
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

/**
 * As there are only 2 possibilities: check url
 * @param url
 */
export const getTypeGitRepo = (url: string): TypeGitRepo => {
  return /github\.com/.test(url) ? "github" : "gitea";
};

export const getLatestRelease = async (
  url: string,
  typeRepo: TypeGitRepo,
  filtersName?: string,
  header?: string
): Promise<string> => {
  return await scrapUrl(getGitUrlTagReleases(url, typeRepo), "GET", header)
    .then((releaseTags: unknown) => {
      const json = JSON.parse(releaseTags as string);
      if (json && Array.isArray(json)) {
        const filtered: string[] = json
          .filter((item) => {
            const tag = getTagFromGitRepoResponse(
              typeRepo,
              item as GiteaReleaseTagModel | GithubReleaseTagModel
            );
            return filtersName ? tag.match(filtersName) : tag;
          })
          .map((item) => {
            return getTagFromGitRepoResponse(
              typeRepo,
              item as GiteaReleaseTagModel | GithubReleaseTagModel
            ) as string;
          });
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

export const getTagFromGitRepoResponse = (
  typeRepo: TypeGitRepo,
  data: GithubReleaseTagModel | GiteaReleaseTagModel
): string => {
  return typeRepo === "gitea"
    ? (data.tag_name as string)
    : (data.name as string);
};
