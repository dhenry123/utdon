# 04 — Data Model & Storage

There is **no SQL database**. All state lives in three JSON files under `data/`
(permissions `0600`), held in memory at runtime and re-written on every mutation
(`dbCommit` / `writeDB`) plus on graceful shutdown.

| File | Type | Content |
|---|---|---|
| `data/database.json` | `UptodateForm[]` | All controls. Six secret fields encrypted at rest. |
| `data/user.json` | `UsersGroupsType` | `{ users: UserType[], groups: GroupsType }`. Passwords hashed; bearers encrypted. |
| `data/globalGithubToken` | encrypted string | The admin-managed global GitHub PAT. |

Path resolution: dev → `<repo>/data/...`; production → `<dist>/../data/...`
(`/app/data/...` in Docker), computed from `__dirname` in
[`src/lib/Database.ts`](../src/lib/Database.ts) and
[`src/lib/Authentification.ts`](../src/lib/Authentification.ts).

All types below are defined in [`src/Global.types.ts`](../src/Global.types.ts) — which
is shared with the client (the SPA imports it directly).

## Control — `UptodateForm`

| Field | Type | Purpose |
|---|---|---|
| `uuid` | string (v4) | Identity; server-generated on insert. |
| `name` | string | Display name. |
| `fixed` | string (optional) | Pinned production version — skips production scraping entirely. |
| `logo` | string (optional) | Base64 image shown on the dashboard card. |
| `urlProduction` | string | Where to read the running version. |
| `headerkey` / `headervalue` | string (optional, **encrypted at rest**) | Optional `Authorization`-style header for `urlProduction`. |
| `scrapTypeProduction` | `"json" \| "text"` | How to interpret the production response. |
| `exprProduction` | string | Regex (text) or JMESPath (json) extracting the version. |
| `urlGitHub` | string | Repository URL (GitHub or Gitea-compatible). |
| `typeRepo` | `"github" \| "gitea"` | Derived from the URL (`github.com` → github, else gitea). |
| `exprGithub` | string (optional) | Keep-regexp applied to release tag names (supports `$1` capture substitution). |
| `headerkeyGit` / `headervalueGit` | string (optional, **encrypted at rest**) | Optional auth header for the git API call. |
| `urlCronJobMonitoring` | string (optional) | Monitoring service base URL — state pushed as `${url}/${0\|1}`. |
| `httpMethodCronJobMonitoring` | string (optional) | HTTP method for the monitoring push. |
| `urlCronJobMonitoringAuth` | string (optional, **encrypted at rest**) | Authorization header value for the monitoring push. |
| `urlCICD` | string (optional) | CI/CD entrypoint triggered on demand. |
| `httpMethodCICD` | string (optional) | HTTP method for the CI/CD call. |
| `urlCICDAuth` | string (optional, **encrypted at rest**) | Authorization header value for the CI/CD call. |
| `isPause` | boolean | Pauses actions (monitoring pushes disabled in compare; UI actions disabled). |
| `compareResult` | `UptoDateOrNotState \| null` | Last stored comparison. |
| `groups` | string[] | Group names controlling visibility/authorization. |
| `authGlobale` | boolean (internal, never persisted) | Set at runtime when the global GitHub token was injected; `dbUpdateRecord` strips the injected git header before writing. |

## Comparison result — `UptoDateOrNotState`

Returned by `getUpToDateOrNotState` and stored on the control:

| Field | Meaning |
|---|---|
| `githubLatestRelease` | Latest tag found on the forge. |
| `productionVersion` | Version extracted from production (or the `fixed` value). |
| `state` | Boolean — up to date? |
| `strictlyEqual` | Exact string equality of both versions. |
| `githubLatestReleaseIncludesProductionVersion` / `productionVersionIncludesGithubLatestRelease` | Mutual substring containment flags (string relationship, kept for compatibility). |
| `productionVersionIsGreater` | Optional (1.11.0, issue #26): production runs a version **newer** than the latest detected release — `state` stays `true` and the UI shows the gray "Unknown" badge. Absent on records persisted before 1.11.0. |
| `urlGitHub`, `urlProduction` | Echo of sources. |
| `ts` | Comparison timestamp. |

`UptoDateOrNotStateResponseMonitoring` extends this with `uuid`, `isPause`, optional
`error`, and the monitoring-push echo, for API responses.

## Users & groups

| Type | Shape | Notes |
|---|---|---|
| `UserType` | `{ login, uuid, password, bearer }` | `password` = PBKDF2-SHA512 hex; `bearer` = AES-encrypted token. |
| `GroupsType` | `{ [groupName]: string[] /* user uuids */ }` | Group membership map; empty groups are auto-removed (`cleanGroups`). |
| `UsersGroupsType` | `{ users, groups }` | The `user.json` shape. |
| `UserDescriptionType` | `{ login, uuid, groups }` | Sanitized projection for the admin UI. |
| `InfoIuType` | `{ login, bearer, uuid, groups }` | Stored in `req.session.user` (`SessionExt`, `src/ServerTypes.ts`). |

Relationship model:

- users ↔ groups: many-to-many via UUID membership; the group named **`admin`** is the
  privileged role.
- controls → groups: by **group name** in `groups[]`. Access rule for a non-admin:
  any intersection between the user's groups and the control's groups (`isRecordInUserGroups`,
  `isAllowedForObject`).

## Encryption at rest

`Authentification.dataEncrypt` / `dataDecrypt` (AES-256-GCM, key =
`sha256(DATABASE_ENCRYPT_SECRET | USER_ENCRYPT_SECRET)`):

- Controls: `urlCICDAuth`, `urlCronJobMonitoringAuth`, `headerkey`, `headervalue`,
  `headerkeyGit`, `headervalueGit` — encrypted on insert/update, decrypted on read
  (decryption failures are logged and the stored value kept as-is).
- User bearers, and the global GitHub token.

⚠️ Implementation caveats (deterministic IV derived from the key, GCM auth tag never
verified) are detailed in [07-security.md](./07-security.md).

## Schema migrations

| Migration | Where | What |
|---|---|---|
| v1.3 → v1.4 | `src/lib/PatchVersion.ts` — `patchV1_3_0To1_4_0`, run at every boot | Any control lacking `groups` gets `groups: ["admin"]`. |
| pre-PR#15 user file → multi-user | `Authentification` constructor | Legacy single-user `user.json` is backed up to `*Before-PR#15-backup.json` and converted to `{users:[...]}`; a file without `groups` gets `{ admin: [...all uuids] }`. |
