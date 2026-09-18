# 03 — API Reference

Base URL: **`/api/v1`** (all routers, `src/main.ts:202-205`). Interactive docs at
**`/api/doc/`** (Swagger UI, served from `openapi.yaml`).

## Authentication

Two accepted schemes for every non-public endpoint (checked by the global gate in
`src/main.ts:189-199`):

1. **Session cookie** (`connect.sid`, express-session) — used by the web UI.
2. **Bearer token** — `Authorization: <token>` header matching a user's personal
   token (see `GET /authtoken`). Intended for cron jobs / CI.

Exceptions:

- `POST /control` (create/update a control) is **session-only** — Bearer-authenticated
  requests receive 403 ("only be performed via the user interface").
- Admin-only endpoints require membership of the `admin` group.
- Public paths are listed in [02-server-architecture.md](./02-server-architecture.md).

## `routerAuth` — authentication, users, groups, global token

| Method & Path | Auth | Description |
|---|---|---|
| `POST /userlogin` | public | Body `{login, password}`. On success, assigns the user to the session (with a regenerate/destroy sequence — see [10-code-observations.md](./10-code-observations.md)). 200 / 401, empty body. |
| `GET /isauthenticated` | public | 204 if session **or** bearer valid, else 401. Used by the SPA router loader. |
| `GET /userlogin` | auth | Returns `{login}` of the authenticated user (UI header rehydration after F5). |
| `GET /userlogout` | public | Destroys the session. 204. |
| `PUT /changepassword` | session | Body `{password, newPassword, newConfirmPassword}`. Verifies old password and confirm match. 204 / 500. |
| `GET /authtoken` | session | Returns the **decrypted** bearer token of the current user (for curl/CI use). |
| `PUT /authtoken` | session | Rotates the current user's bearer token (new random value, re-encrypted at rest). 204 / 500. |
| `GET /isadmin` | auth | 204 if the user is in the `admin` group, else 401. |
| `GET /groups` | session | Admin: all group names. Normal user: own group names. |
| `GET /userGroups` | session | `{groups: [...]}` of the current user. |
| `GET /users` | **admin** | Sanitized user list `[{login, uuid, groups}]` — no secrets. |
| `POST /users` | **admin** | Body `{login, password, groups[]}`. Rejects duplicate logins. 200 `{login}` / 400. |
| `PUT /users` | **admin** | Body `{uuid, login, password?, groups[]}` (same shape + `uuid`). Re-hashes password when provided; replaces group membership; cleans up empty groups. 204 / 400. |
| `DELETE /users/{uuid}` | **admin** | Deletes a user (cannot delete self). 200 `{login, uuid}` / 400 / 401. |
| `GET /globalgithubtoken` | **admin** | Returns the decrypted global GitHub token. |
| `PUT /globalgithubtoken` | **admin** | Body `{token}` (empty string resets it). Encrypts with `DATABASE_ENCRYPT_SECRET` to `data/globalGithubToken`. 200 `"OK"`. |

## `routerControls` — control CRUD

| Method & Path | Auth | Description |
|---|---|---|
| `POST /control` | **session only** (403 for Bearer) | Create or update a control. With `uuid` → update, without → insert (server generates uuid v4). Validates mandatory non-empty fields: `name`, `urlProduction`, `scrapTypeProduction`, `exprProduction`, `urlGitHub`, `exprGithub`, `groups`. Group authorization: caller must be admin or share a group with the control (`isAllowedForObject`). Always commits to disk. `typeRepo` derived from the URL. 200 `{control}` / 503. |
| `GET /control/{uuid}` | auth | `uuid` may be `all`. Group-filtered (admins see everything); secrets decrypted on the fly; list ordered by `recordsOrder` (to-update first). 200 record or array / 404. |
| `DELETE /control/{uuid}` | auth, group-filtered | Deletes after a group-filtered lookup. 200 `{uuid}` / 404. |

## `routerActions` — comparison and hooks

| Method & Path | Auth | Description |
|---|---|---|
| `PUT /action/compare/{controlUuid}/{setStatus}` | auth | **The core feature.** `controlUuid` may be `all`; `setStatus` is `0` (compare only) or `1` (compare + push state to the monitoring service). For each (authorized) control: apply global GitHub token when applicable, run `getUpToDateOrNotState`, store `compareResult`, commit. With `setStatus=1` and `urlCronJobMonitoring` set and not paused, pushes `${url}/${0\|1}` (`0` = up to date) with the configured `Authorization` header; on compare error pushes `/1`. Returns 200 with result(s); **500 with the same body if any control errored**; 404 unknown uuid. |
| `PUT /action/setstatus/` | auth | Body `{uuid, state}`. Manually pushes `0`/`1` to the control's monitoring URL. 200 / 404. (Sends **no response at all** if `uuid` is missing — see [10-code-observations.md](./10-code-observations.md).) |
| `PUT /action/cicd/` | auth | Body `{uuid}`. Fires the control's `urlCICD` with `httpMethodCICD` and its `Authorization` header. 200 connection info / 404 (no uuid / no urlCICD) / 500. |
| `GET /action/lastcomparegitrelease/{controlUuid}` | auth | Returns `compareResult.githubLatestRelease` from the stored last compare (handy for CI scripts). 200 string / 404. |

## `routerCore` — scraping, health, version

| Method & Path | Auth | Description |
|---|---|---|
| `GET /scrap/{url}` | auth | Server-side fetch of an arbitrary URL (GET, 3 s timeout, proxy-aware). Optional custom header via the `scrapurlheader` request header (`"key:value"`). Injects `Authorization: Bearer <globalGithubToken>` for github.com URLs when the caller supplies no header. Returns raw body text. Used by the UI wizard to test extraction expressions (also avoids browser CORS). |
| `GET /version` | public | `{"version": "1.10.0"}`. |
| `GET /healthz` | public | Liveness probe. 204. |
| `GET /metrics` | auth | **Not implemented** (roadmap). 503. |

## `openapi.yaml` coverage

The in-app Swagger spec documents only 7 paths (`/action/*`, `/control/{uuid}`,
`/version`, ``/healthz`, `/metrics`) and declares the two security schemes
(`ApiKeyAuth` on the `Authorization` header, `cookieAuth` on `connect.sid`). Its
`info.version` (1.5.0) and path coverage **lag the implementation** (1.10.0) — the
auth/user/group endpoints and `/scrap` are not documented there. This file is the
authoritative reference.

## Response and error conventions

- Success: 200 with JSON body, or 204 (no content) for state checks/updates.
- Not authenticated: 401. Not authorized (admin route as normal user): 401.
- Validation failures: 400/503 with `{"error": ...}` depending on route.
- Unhandled errors: 500 `{"error":"Something went wrong"}` — except upstream fetch
  failures (`TypeError: fetch failed`), where the raw error text is passed through.
- All responses go through the central error handler in `src/main.ts:221-245`.
