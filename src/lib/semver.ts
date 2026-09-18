/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

/**
 * Minimal SemVer (https://semver.org) support for release-tag ordering
 * and comparison. Tolerates the common "v"/"V" tag prefix; build metadata
 * is parsed but ignored, as per the specification.
 * Returns null for anything that is not strict X.Y.Z — callers must fall
 * back to their own legacy behavior in that case.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build?: string;
}

const SEMVERREGEXP =
  /^[vV]?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export const parseSemver = (version: string): SemVer | null => {
  if (typeof version !== "string") return null;
  const match = version.trim().match(SEMVERREGEXP);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split(".") : [],
    build: match[5],
  };
};

const comparePrereleaseIdentifiers = (a: string, b: string): number => {
  const aIsNumeric = /^\d+$/.test(a);
  const bIsNumeric = /^\d+$/.test(b);
  if (aIsNumeric && bIsNumeric) {
    return Number(a) === Number(b) ? 0 : Number(a) < Number(b) ? -1 : 1;
  }
  // numeric identifiers always have lower precedence than alphanumeric ones
  if (aIsNumeric) return -1;
  if (bIsNumeric) return 1;
  return a === b ? 0 : a < b ? -1 : 1;
};

const comparePrerelease = (a: string[], b: string[]): number => {
  if (a.length === 0 && b.length === 0) return 0;
  // a normal version has higher precedence than its prereleases
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === undefined) return -1; // fewer identifiers: lower precedence
    if (b[i] === undefined) return 1;
    const cmp = comparePrereleaseIdentifiers(a[i], b[i]);
    if (cmp !== 0) return cmp;
  }
  return 0;
};

export const compareSemverParsed = (a: SemVer, b: SemVer): number => {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return comparePrerelease(a.prerelease, b.prerelease);
};

/**
 * three-way comparison: < 0 a lower, > 0 a greater, 0 equal
 * null when either side is not parsable SemVer
 */
export const compareSemver = (a: string, b: string): number | null => {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;
  return compareSemverParsed(pa, pb);
};
