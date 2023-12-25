/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { search } from "@metrichor/jmespath";

/**
 * extract data from text by regexp match & regexp subst - only group[1] is return
 * @param targetText
 * @param regexpMatch
 * @returns
 */
export const filterText = (
  targetText: string | null,
  regexpMatch: string
): string => {
  try {
    if (!regexpMatch || !regexpMatch.trim()) return "";
    if (targetText) {
      const match = targetText.match(new RegExp(regexpMatch));
      if (match && match[1]) return match[1];
    }
    return "";
  } catch (error) {
    return "";
  }
};

/**
 * extract data from json by key
 * @param outputJson
 * @param key
 * @returns
 */
export const filterJson = (outputJson: string | null, expr: string): string => {
  if (outputJson) {
    try {
      // search join allowed on strings onlyconvert all number TYPE attributs to String : https://stackoverflow.com/a/7389888
      const json = outputJson.replace(/: *(\d+)([ *, *\\}])/g, ':"$1"$2');
      // all number are string so search is usable
      if (json && expr) {
        const res = search(JSON.parse(json), expr);
        if (res) return JSON.stringify(res).replace(/^"+|"+$/g, "");
      }
    } catch (error) {
      // unexpected errors
      return "";
    }
  }
  return "";
};

/**
 * is String parsable as JSON
 * @param data
 * @returns
 */
export const isJsonParsable = (data: string | null) => {
  if (!data) return false;
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
};
