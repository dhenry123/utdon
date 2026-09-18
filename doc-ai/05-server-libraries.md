# 05 — Server Library Reference (`src/lib/`)

## `Authentification.ts` — users, groups, auth decisions

Class `Authentification` holds `usersgroups` in memory, persisted to `data/user.json`
on every mutation (`writeFileSync`, mode 0600).

Key methods:

- `verifyPassword(login, password)` → `[200, InfoIuType]` / `[401, ...]` / `[500, ...]`
  — PBKDF2 comparison (see [07-security.md](./07-security.md)).
- `isAuthenticated(req)` — session **or** bearer.
- `isAuthSession(req)` — session check; **returns true unconditionally (as admin) when
  `environment=development`**, logging a warning.
- `isAuthBearer(req)` — compares the `Authorization` header against every user's
  decrypted bearer; on match, **populates `req.session.user`** so downstream role
  checks work without a cookie.
- `isAdmin(req)` — session user is a member of group `admin`.
- `isAllowedForObject(user, object)` — admin **or** any group intersection with
  `object.groups`.
- User CRUD: `makeUser` (validates login/password/uuid/bearer and requires
  `USER_ENCRYPT_SECRET`), `deleteUser` (blocks the literal uuid `"admin"` and
  self-deletion at route level), `changePassword`, `changeBearer`, `getUserBearer`,
  `getUsersForUi` (sanitized), `getInfoForUi`.
- Group ops: `addGroupMember` (creates group on the fly), `removeUserFromGroups`,
  `cleanGroups` (drops empty groups), `getUserGroups`, `getGroups`.
- Static `dataEncrypt` / `dataDecrypt` — AES-256-GCM helpers shared by all
  secret-at-rest encryption (users, controls, global token).
- `generateBearerKey` — 16 random bytes, hex.

## `Database.ts` — controls store

In-memory `UptodateForm[]` cached as `app.get("DB")`, persisted to
`data/database.json` by `dbCommit`.

- `dbConnect` / `dbCreate` / `dbGetData` — lifecycle; created with mode 0600.
- `dbInsert(db, record)` — generates uuid v4, **encrypts the six secret fields**,
  pushes, returns the stored record.
- `dbGetRecord(db, uuid|"all", userGroups, isAdmin, logger)` — single record or
  group-filtered list, **decrypted on read**; decryption failures logged, value kept.
- `dbUpdateRecord` — re-encrypts secrets; **if `authGlobale` is set** (global GitHub
  token was injected at runtime), writes empty `headerkeyGit`/`headervalueGit` so the
  global token is never persisted into a control.
- `dbDeleteRecord` — in-memory splice; callers must `dbCommit`.
- `isRecordInUserGroups` — any shared group name.

## `scrapUrlServer.ts` — outbound HTTP engine + comparison pipeline

- `scrapUrlThroughProxy(url, method, customHttpHeader?, httpProxy?, httpsProxy?)` —
  the **only** outbound HTTP client (raw `http`/`https` `request`, not fetch/axios):
  - `User-Agent: Node.js/20 (Linux)`;
  - one optional custom header parsed from a `"key:value"` string;
  - proxy agents: `HttpsProxyAgent` for https URLs behind `HTTPS_PROXY`,
    `HttpProxyAgent` for http URLs behind `HTTP_PROXY`;
  - `rejectUnauthorized: false` when `NODE_TLS_REJECT_UNAUTHORIZED == "0"`;
    optional CA bundle from `${cwd}/cacerts/${PROXYCA_CERT}`;
  - 3000 ms timeout on both agent and request; non-2xx rejects with the received body;
  - resolves `{ httpProxy, httpsProxy, data }`.
- `isProxyRequired(url, envNoProxy)` — NO_PROXY-style matching with `*` wildcards;
  defined for tests/client parity (not used by server routes).
- `getUpToDateOrNotState(record)` — the **compare pipeline**:
  1. `record.fixed` set → use it as production version (skip scraping);
  2. else GET `urlProduction` with `headerkey:headervalue`, apply `filterJson` or
     `filterText` per `scrapTypeProduction`;
  3. GET the git releases API URL with `headerkeyGit:headervalueGit`;
  4. `getLatestRelease` with the optional `exprGithub` filter;
  5. `compareVersion` → `UptoDateOrNotState`.

## `Features.ts` — comparison semantics & ordering

- `compareVersion(name, sourceCodeVersion, productionVersion)` — **not semver-aware**:
  exact string equality (`strictlyEqual`), otherwise mutual regex-containment tests
  (`githubLatestReleaseIncludesProductionVersion` and the reverse). `"v1.8.9"` vs
  `"1.8.9"` → up to date *with warning*. Versions containing regex metacharacters can
  behave unexpectedly (see [10-code-observations.md](./10-code-observations.md)).
- `recordsOrder(records)` — dashboard sort: to-update (incl. never-compared) first,
  then up-to-date-with-warning, then strictly up-to-date.

## `helperGitRepository.ts` — forge API plumbing

- `getGitUrlTagReleases(url, typeRepo)` — GitHub → `https://api.github.com/repos/{owner/repo}/releases`
  (protocol+domain stripped by regex); Gitea → `{scheme}://{domain}/api/v1/repos/{path}/releases`.
- `getTypeGitRepo(url)` — `/github\.com/` → `github`, anything else → `gitea`.
- `getLatestRelease(typeRepo, json, filtersName?)` — extracts tag names
  (GitHub: `tag_name ?? name`; Gitea: `tag_name`), optionally regex-filters
  (`filterAndReplace`, with `$1` capture substitution), returns the **first** entry
  (relies on the forges returning newest-first).

## `helperProdVersionReader.ts` — version extraction (shared with the browser)

- `filterText(text, regexpMatch)` — returns **capture group 1** of the user-supplied regex.
- `filterJson(json, expr)` — **JMESPath** (`@metrichor/jmespath`); first rewrites all
  JSON numbers to strings so functions like `join('.', *)` work on numeric fields,
  then strips surrounding quotes from the result.
- `isJsonParsable` — try/catch JSON check.

These run in the browser too (imported across the tree by the client wizard) so the
"test extraction" preview matches server behavior exactly.

## `GlobalGithubToken.ts` — global PAT management

- Persists the token to `data/globalGithubToken`, AES-encrypted with
  `DATABASE_ENCRYPT_SECRET`; read/write via the admin endpoints.
- `setControlGlobalGithubToken(record, token)` — when a control has **no** git auth
  header of its own and its URL matches `github.com`, injects
  `Authorization: Bearer <token>` and sets the `authGlobale` marker (which
  `dbUpdateRecord` uses to avoid persisting the injected header).
- `getHeaderGlobalGithubToken(record, token)` — same logic as a raw `"key:value"`
  string for the `/scrap` endpoint.

## `logs.ts` — structured logging helpers

- `getBase(req)` — extracts `userId`, `userLogin`, `ipAddr` (`req.ip`, enabled by
  `trust proxy`), `apiPath`, `apiMethod`.
- `getLogObjectInfo` / `getLogObjectError` — merge extra fields (uuid, scrapResponse,
  user CRUD events, auth-provided flags) into the base. Quirk: `uuid` and
  `scrapResponse` overwrite the `message` field.

## `PatchVersion.ts` — schema migrations

`patchV1_3_0To1_4_0(db)` — any control without `groups` gets `groups: ["admin"]`;
applied at every boot before the first commit.
