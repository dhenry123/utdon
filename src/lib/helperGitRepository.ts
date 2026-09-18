/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import {
  GiteaReleaseTagModel,
  GithubReleaseTagModel,
  TypeGitRepo,
} from "../Global.types";
import { parseSemver, compareSemverParsed, SemVer } from "./semver.js";

export const getGitUrlTagReleases = (
  gitRepoUrl: string,
  typeRepo: TypeGitRepo
) => {
  if (typeRepo === "github") {
    const githubApiReleasesEntry = "https://api.github.com/repos";
    const regExpExtractDomain = "^https?:\\/\\/[^@\\/\n]+\\/";
    const owner = gitRepoUrl.replace(new RegExp(regExpExtractDomain), "");
    return `${githubApiReleasesEntry}/${owner}/releases`;
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

/**
 * Select the latest tag from a list (issue #26).
 * GitHub/Gitea list releases by internal id (creation order), which is NOT
 * version order when a backport is published after a newer release — so the
 * greatest SemVer tag wins. Falls back to the first entry when no tag is
 * parsable SemVer (non semver versioning schemes).
 * @param tags tag names
 * @param filtersName optional keep-regexp, applied to every entry ($1
 * capture substitution included) before comparing
 * @returns the selected tag, "" when no tag matches the filter
 */
export const selectLatestTag = (
  tags: string[],
  filtersName?: string
): string => {
  const regExp = filtersName ? new RegExp(filtersName) : undefined;
  const matching = regExp
    ? tags.filter((tag) => tag && tag.match(regExp))
    : tags;
  if (matching.length === 0) return "";
  const candidates =
    regExp && filtersName?.match(/\(/)
      ? matching.map((tag) => tag.replace(regExp, "$1"))
      : matching;
  let latest: string | null = null;
  let latestSemver: SemVer | null = null;
  for (const candidate of candidates) {
    const parsed = parseSemver(candidate);
    if (
      parsed &&
      (!latestSemver || compareSemverParsed(parsed, latestSemver) > 0)
    ) {
      latestSemver = parsed;
      latest = candidate;
    }
  }
  // no parsable semver: keep the historical first-entry behavior
  return latest ?? candidates[0];
};

export const getLatestRelease = (
  typeRepo: TypeGitRepo,
  releaseTags: string,
  filtersName?: string
): string => {
  const json = JSON.parse(releaseTags as string);
  if (json && Array.isArray(json)) {
    const tags = json.map((item) => {
      return getTagFromGitRepoResponse(
        typeRepo,
        item as GiteaReleaseTagModel | GithubReleaseTagModel
      );
    }) as string[];
    return selectLatestTag(tags, filtersName);
  }
  // if Github change specifications ???? - hard to test
  // trying with an other domain return 404
  return "";
};

export const getTagFromGitRepoResponse = (
  typeRepo: TypeGitRepo,
  data: GithubReleaseTagModel | GiteaReleaseTagModel
): string => {
  return typeRepo === "gitea"
    ? (data.tag_name as string)
    : ( data.tag_name ? data.tag_name as string : data.name as string);
};
