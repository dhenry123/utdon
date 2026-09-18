# 11 — Issue #26: Version Ordering — Design & Fix

Fix for [github.com/dhenry123/utdon/issues/26](https://github.com/dhenry123/utdon/issues/26)
("Versions ordering issues?", reported by skid9000), implemented test-first on branch
`fix/issue-26-version-ordering`.

## Problem

Two reported defects, both confirmed:

1. **Wrong "latest" release.** `getLatestRelease` returned the **first** entry of the
   releases array, assuming the forge lists the newest version first. GitHub/Gitea
   order releases by **internal id (creation order)**. Any repo that publishes a
   release for an older branch *after* a newer one (backports, security patches)
   breaks the assumption — e.g. VictoriaLogs: the `v1.51.1` backport (created
   2026-08-18) is listed **before** `v1.52.0` (created 2026-07-16). Not an isolated
   case: it affects every repo with out-of-order publishing.
2. **No ordering in the comparison.** `compareVersion` used string equality plus
   mutual regex containment only. A production version **newer** than the detected
   release was flagged "TO UPDATE" (false alarm).

```mermaid
sequenceDiagram
    autonumber
    participant U as UTDON (before fix)
    participant GH as GitHub API /repos/VictoriaMetrics/VictoriaLogs/releases
    U->>GH: GET releases (first page, no sort params)
    GH-->>U: ordered by internal id (creation order), NOT by version
    Note over U: [0] v1.51.1 — backport, created 2026-08-18<br/>[1] v1.52.0 — greatest version, created 2026-07-16
    Note over U: getLatestRelease() returns filtered[0] → v1.51.1 ❌
    Note over U: compareVersion("v1.51.1", "1.52.0")<br/>no equality, no containment, no ordering → state = false
    U-->>U: Dashboard: "TO UPDATE" — false alarm
```

## Solution

```mermaid
flowchart LR
    subgraph NEW["NEW — src/lib/semver.ts, zero dependencies"]
        S1["parseSemver() — v-prefix, X.Y.Z, prerelease, build<br/>compareSemver() — full semver ordering"]
    end
    S1 --> G["selectLatestTag() + getLatestRelease()<br/>helperGitRepository.ts<br/>pick semver-MAX instead of filtered[0]"]
    S1 --> C["compareVersion()<br/>Features.ts<br/>ordering when both sides parse"]
    G --> SRV["Server compare pipeline"]
    C --> SRV
    G --> CLI["Client wizard tag preview<br/>(imports the same shared module)"]
    C --> T["Global.types.ts<br/>+ optional productionVersionIsGreater"]
```

### `selectLatestTag(tags, filtersName?)` — new shared export

```mermaid
flowchart TD
    Start["Tag list from the releases API (first page, 30 entries)"] --> F{"Keep-regex exprGithub?"}
    F -->|"yes"| K["Keep matching entries,<br/>apply $1 substitution to EVERY entry"]
    F -->|"no"| ALL["All tags"]
    K --> P
    ALL --> P["parseSemver() on each tag"]
    P --> Q{"At least one tag parses as semver?"}
    Q -->|"yes"| MAX["Return the MAX by compareSemver<br/>rule: 1.52.0-rc.1 < 1.52.0"]
    Q -->|"no"| FB["FALLBACK: first entry<br/>(= historical behavior, non-semver repos)"]
    MAX --> OUT["githubLatestRelease"]
    FB --> OUT
```

`getLatestRelease` now extracts tag names and delegates to `selectLatestTag`.
`filterAndReplace` is kept for compatibility but no longer used for selection.
The client wizard (`ScrapGitHubReleaseTags.tsx`) calls `selectLatestTag` too, so the
"latest available version detected" preview matches the server exactly.

### `compareVersion` — semver first, legacy fallback

```mermaid
flowchart TD
    A["sourceCodeVersion vs productionVersion"] --> B{"Strict string equality?"}
    B -->|"yes"| C["UP TO DATE — green"]
    B -->|"no"| D{"Both sides parseSemver()?"}
    D -->|"yes"| E{"compareSemver(production, latest)"}
    E -->|"equal"| F["UP TO DATE — warning (v-prefix only difference)"]
    E -->|"production GREATER"| G["UP TO DATE — warning<br/>productionVersionIsGreater = true (NEW)"]
    E -->|"production LOWER"| H["TO UPDATE — correct"]
    D -->|"no"| I["LEGACY mutual regex containment<br/>(unchanged)"]
    I -->|"match"| J["UP TO DATE — warning"]
    I -->|"no match"| H
```

- The containment flags keep their original meaning (string relationships) and are
  still computed, so existing UI displays are unchanged.
- `productionVersionIsGreater` (optional field on `UptoDateOrNotState`) marks the
  "running ahead of the latest release" case. Per the reporter's suggestion in the
  issue thread, the UI renders it as a **gray "Unknown" badge** (`Badge isUnknown`,
  `Control.tsx`, `ResultCompare.tsx`) with a dedicated message in the compare dialog —
  deliberately not "UP to date", since the state is undeterminable (the matching
  release may simply not be published yet).
- Old persisted `compareResult`s stay valid: the new field is optional.
- Pure semver choice, documented: `1.53.0-rc.1` **beats** `1.52.0` (use the keep-regex
  to exclude prereleases when undesired).

## Validation

- Test-first: 35 new tests (`test/semver.test.ts` 16, `Features.test.ts` +7,
  `helperGitRepository.test.ts` +12, including offline fixture
  `test/samples/releases-out-of-order.json` modeled on the VictoriaLogs response).
- Live end-to-end through the real VictoriaLogs API:
  - production `1.52.0` → latest correctly `v1.52.0` → **up to date** (was: false alarm);
  - production `1.53.0` → **up to date, warning, `productionVersionIsGreater: true`**.
- Behavioral change to note in the changelog: for repos maintaining two version
  streams without a keep-regex, the greatest (e.g. 2.x) now wins.

## Test-environment note: local proxy

The Jest suite hits live endpoints, some through the corporate proxy configured in
`.envTest` (`HTTP_PROXY`/`HTTPS_PROXY`). When no proxy is available, this repository
now ships a minimal dependency-free proxy:

```bash
npm run startLocalProxy   # listens on http://127.0.0.1:3128
```

Then point `.envTest` at it (`HTTP_PROXY`/`HTTPS_PROXY` =
`http://127.0.0.1:3128`, `PROXYCA_CERT=""` — HTTPS is tunneled with CONNECT, TLS
stays end-to-end, no CA needed). See `.envTest-sample`.

Known unrelated failure: `getUpToDateOrNotState - GitHub header autorization` requires
a **valid** `GITHUBTOKEN` in `.envTest`; an expired token yields GitHub 401
"Bad credentials".
