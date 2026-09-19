# 08 — Testing

## Harness

- **Jest 30 + ts-jest in ESM mode** — config: [`jest.config.ts`](../jest.config.ts)
  (`preset: ts-jest/presets/default-esm`, `testEnvironment: node`, ESM extensions,
  `.js` module-name mapping stripped, `setupFiles: ["./jestLoadEnvironmentTest.ts"]`).
- **Env bootstrap**: [`jestLoadEnvironmentTest.ts`](../jestLoadEnvironmentTest.ts)
  parses `./.envTest` (must exist — copy from `.envTest-sample`) into `process.env`.
- **Run**: `npm test`
  (= `NODE_OPTIONS='--experimental-vm-modules --no-warnings' jest --config jest.config.ts`;
  `jest.config.ts` excludes `client/` — the client has its own suite).
- **Type checking for tests**: [`tsconfig.test.json`](../tsconfig.test.json)
  (adds `jest`/`node` types).
- **Live-network tests** (GitHub/Codeberg/immich/Google, and the proxy tests) can run
  through the bundled minimal proxy when no corporate proxy is available:
  `npm run startLocalProxy` (listens on 127.0.0.1:3128), with `HTTP_PROXY`/`HTTPS_PROXY`
  pointing at it in `.envTest` (`PROXYCA_CERT` empty — HTTPS is CONNECT-tunneled).
- **The client has its own suite since 1.11.0**: **Vitest 5 + React Testing Library**
  in `client/` — `cd client && npm test` (57 tests: redux slices, helpers, UI kit,
  curl generation, wizard-preview guard for the issue #26 fix). Config in
  `client/vite.config.ts` (`environment: jsdom`, explicit `globals: false` with manual
  RTL cleanup in `client/src/test/setup.ts`). Not covered: Router loaders, page-level
  features (`DisplayControls`, `ControlManager`, `UserManager`), RTK Query endpoints.

## Suite composition (server: 201 cases across 9 suites, all under `test/`)

| File | ~Cases | Scope | Network |
|---|---|---|---|
| `Authentification.test.ts` | 54 | User DB lifecycle; legacy-schema migration (with backup-file check); bearer generation; `makeUser` validation; user CRUD (admin undeletable, duplicates); `verifyPassword` 200/401/500; `isAuthSession` variants incl. the development-mode bypass (with a winston warning assertion); `isAuthBearer`; `changePassword` success + 5 failure variants; `dataEncrypt`/`dataDecrypt` round-trips | none |
| `Database.test.ts` | 29 | `dbConnect`/`dbCreate`/`dbGetData` (empty/malformed/no-content); `dbInsert`; `dbCommit` (incl. read-only file → `EACCES`); `dbGetRecord` (uuid / `all` / group authorization / undecryptable-secret logging); `dbDeleteRecord`; `dbUpdateRecord` (incl. global-token header stripping); `isRecordInUserGroups` | none |
| `Features.test.ts` | 12 | `compareVersion` semantics incl. semver ordering and `productionVersionIsGreater` (issue #26); `recordsOrder` dashboard sorting | none |
| `semver.test.ts` | 16 | `parseSemver` / `compareSemver`: v-prefixes, prerelease precedence, numeric identifiers, build metadata ignored, non-semver → null | none |
| `Groups.test.ts` | 17 | Group membership ops; `getGroups` for admin vs normal user (mocked express `Request`); `cleanGroups`; `isAllowedForObject` (admin bypass / member / groupless) | none |
| `helperGitRepository.test.ts` | 28 | URL builders; repo-type detection; tag scraping; `getLatestRelease`/`selectLatestTag` incl. greatest-tag selection on an out-of-order releases fixture (`test/samples/releases-out-of-order.json`); `filterAndReplace` | **live**: scrapes `github.com/dhenry123/utdon` and `codeberg.org/forgejo/forgejo`; local mock HTTP server on port 27055 for timeout tests |
| `helperProdVersionReader.test.ts` | 17 | `filterText` / `filterJson` / `isJsonParsable` incl. error paths | 2 live tests against `https://www.google.com` |
| `scrapUrlServer.test.ts` | 27 | `isProxyRequired`/NO_PROXY matching (10 pure cases); `scrapUrlThroughProxy` through real proxies from `.envTest`; `getUpToDateOrNotState` end-to-end against `demo.immich.app` + GitHub immich releases (fixed-value, text scrap type, error paths; one test needs `GITHUBTOKEN`) | **live** (proxies, Google, immich, GitHub) |
| `checkJestInstallation/sum.test.ts` | 1 | Toolchain sanity check | none |

**Strategy**: unit tests against real filesystem JSON databases under `test/data/`
(reset in `beforeEach`, git-ignored), mocked express request/session objects, a custom
winston transport to assert error logs, a local mock HTTP server for timeouts — plus a
deliberate set of **live-network integration tests**. No HTTP-mocking library is used.
This is why CI does not run the suite (see [09-build-deployment.md](./09-build-deployment.md)).

## Fixtures

- `test/data/` — scratch databases (`database.json`, `userDatabase.json`), reset per test.
- `test/samples/`:
  - `users-before-PR#15.json` — legacy single-user schema for the migration test;
  - `database-empty.json`, `database-malformed-object.json`, `database-nocontent.json`,
    `database-readonly.json` — DB parsing/permission error paths;
  - `reorder1.json`, `reorder2.json` — `recordsOrder` inputs;
  - `html-version.response.html` (contains `v3.0.1`), `json-version.response.json`
    (`api.version`) — version-filter inputs;
  - `tags-reponse-github-tags.json`, `samples/database.json` — **legacy, unreferenced**.
- `test/cacerts/` — intended home for a proxy CA cert (only `.keep` committed; note
  `scrapUrlServer.test.ts:18` points `NODE_EXTRA_CA_CERTS` at `tests/cacerts` —
  directory is `test`, apparent typo).

## Coverage

[`CoverageExplanations.md`](../CoverageExplanations.md) records ≈ **99.13% statements /
96.17% branches / 100% functions / 99.8% lines** over `src/`, with the two uncovered
branches (`Authentification.ts:342`, `Database.ts:207`) annotated with reasons.
Coverage is generated on demand (no `collectCoverage` in the Jest config).
