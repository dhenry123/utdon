# 02 — Server Architecture

Server entry point: [`src/main.ts`](../src/main.ts) (compiled to `dist/main.js`, which
is the Docker `CMD`). ES-module TypeScript (`"type": "module"`), compiled with `tsc`
(target ES2022, `strict`).

## Boot sequence

`src/main.ts`, in order:

1. **Logger** — winston, level `info`, JSON format with timestamps,
   `defaultMeta: { service: "utdon" }`, Console transport only. Stored in the Express
   app as `app.set("LOGGER")`.
2. **Mandatory environment check** — `process.exit(1)` if `USER_ENCRYPT_SECRET` or
   `DATABASE_ENCRYPT_SECRET` is unset.
3. **Controls database** — `dbConnect`/`dbCreate` ensure `data/database.json` exists
   (created as `[]`, file mode `0o600`). `dbGetData` parses it,
   `patchV1_3_0To1_4_0` migrates old records, `dbCommit` persists, and the array is
   cached in app state (`app.set("DB", ...)`).
4. **Users database** — an `Authentification` instance over `data/user.json`. If the
   users array is empty, a default `admin`/`admin` user is created in the `admin`
   group (`ADMINUSERLOGINDEFAULT` / `ADMINPASSWORDDEFAULT`).
5. **App state as service locator** — `app.set("DB" | "DBFILE" | "AUTH" | "LOGGER")`;
   all routes obtain dependencies via `req.app.get(...)`.
6. **Helmet** — CSP configured as `defaultSrc ["'self'", "'unsafe-inline'"]`,
   `imgSrc ["'self'", "data:"]`, `useDefaults: false` for CSP (other helmet
   middlewares run with defaults).
7. **Body parsing** — `express.json({ limit: "200kb" })` (`JSON_POST_MAX_SIZE`).
8. **Session** — `express-session` with `secret: crypto.randomBytes(16).toString("hex")`
   (a **fresh secret per process start** → all sessions invalidated on restart),
   `resave: false`, `saveUninitialized: false`, default **MemoryStore** (sessions live
   in RAM only). Cookie is the default `connect.sid`.
9. **Listen config** — `PORT` env else **3015**, `IPADDRESS` env else `0.0.0.0`,
   `app.set("trust proxy", true)` so `req.ip` honors `X-Forwarded-For` behind a
   reverse proxy.
10. **CORS/OPTIONS shim** — sets `Access-Control-Allow-Methods` / `Allow-Headers` and
    short-circuits `OPTIONS` with 200. No `Access-Control-Allow-Origin` is ever set
    (same-origin SPA by design).
11. **Static SPA serving** — `express.static` with etags on `/`, `/login`,
    `/ui/editcontrol/*path`, `/ui/addcontrol`. Public path is `../client/dist/` in
    development, `/public` (i.e. `/app/public` in Docker) in production.
12. **Swagger UI** — if `./openapi.yaml` exists, served at **`/api/doc/`**.
13. **Global authentication gate** — for every request whose path is **not** in
    `API_ENTRY_POINTS_NO_NEED_AUTHENTICATION`, `auth.isAuthenticated(req)` (session
    **or** Bearer token) must pass; failure becomes 401 in the error handler.
14. **API routers** — `routerAuth`, `routerControls`, `routerActions`, `routerCore`
    mounted under **`/api/v1`** (the only version; hardcoded prefix).
15. **404 handler** and **error handler** — logs full stack as JSON; maps
    `SERVER_ERROR_USER_IS_NOT_AUTHENTIFIED` to 401, everything else to 500. The raw
    error text is returned to the client only for `TypeError: fetch failed`, otherwise
    the generic `{"error":"Something went wrong"}`.
16. **Listen** — plain `http.createServer` (TLS termination is expected upstream).
17. **Graceful shutdown** (non-development) — `SIGTERM` / `SIGINT` / `SIGUSR2` → wait
    500 ms, `dbCommit` the in-memory databases to disk, exit 0.

### Paths without authentication (`Constants.ts` — `API_ENTRY_POINTS_NO_NEED_AUTHENTICATION`)

`/`, `/login`, `/ui/editcontrol/*`, `/ui/addcontrol`, `/api/v1/healthz`,
`/api/v1/userlogin`, `/api/v1/userlogout`, `/api/v1/isauthenticated`,
`/api/v1/version`, `/api/doc/`

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `USER_ENCRYPT_SECRET` | **Yes** | PBKDF2 salt for passwords + AES key material for bearer tokens. Server exits without it. |
| `DATABASE_ENCRYPT_SECRET` | **Yes** | AES key material for control secrets and the global GitHub token. Server exits without it. |
| `PORT` | No | Listen port, default `3015`. |
| `IPADDRESS` | No | Bind address, default `0.0.0.0`. |
| `environment` | No | `development` switches data/static paths **and bypasses authentication entirely** (every request is admin — see [07-security.md](./07-security.md)). |
| `HTTP_PROXY` / `HTTPS_PROXY` | No | Outbound proxy for scraping (http URLs → `HttpProxyAgent`, https URLs → `HttpsProxyAgent`). |
| `PROXYCA_CERT` | No | Filename of a PEM CA bundle under `${cwd}/cacerts/` for TLS-intercepting proxies. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | `0` disables certificate verification for outbound scrapes (self-signed environments). |
| `NODE_EXTRA_CA_CERTS` | No | Additional Node CA certificates (see install docs). |

## Constants (`src/Constants.ts`)

Selected constants (see the file for the full list):

| Constant | Value | Notes |
|---|---|---|
| `APPLICATION_VERSION` | `"1.11.0"` | Kept in sync by `updateVersion.sh`. |
| `NODEJSVERSION` | `"20"` | Used in the outbound `User-Agent: Node.js/20 (Linux)`. |
| `HTTPREQUESTTIMEOUT` | `3000` | Outbound request + agent timeout (ms). |
| `ADMINUSERLOGINDEFAULT` / `ADMINPASSWORDDEFAULT` | `admin` / `admin` | First-boot account. |
| `CIPHERSHAALGORITHM` / `CIPHERALGORITHM` | `sha256` / `AES-256-GCM` | Used by `Authentification.dataEncrypt/dataDecrypt`. |
| `JSON_POST_MAX_SIZE` | `"200kb"` | JSON body limit. |
| `MAXFILESIZEKBITS` | `100` | Client logo upload limit. |
| `OPENAPIFILEYAML` | `./openapi.yaml` | Swagger source. |
| `SERVER_ERROR_*` | strings | Error identifiers used as control flow between layers. |

`src/Constants-dev.ts` contains Storybook fixtures only (`STORYBOOK_UPDATEORNOTSTATE`,
`STORYBOOK_UPTODATEFORM`); the server never imports it.

## Data files at runtime

| File (relative to install) | Content |
|---|---|
| `data/database.json` | All controls (`UptodateForm[]`), secret fields encrypted, mode 0600. |
| `data/user.json` | `{ users: UserType[], groups: GroupsType }`, mode 0600. |
| `data/globalGithubToken` | Single AES-encrypted global GitHub PAT (no file extension). |

Path resolution differs between dev (`<repo>/data/...`) and production
(`<dist>/../data/...`, i.e. `/app/data/...` in Docker) — computed from `__dirname`.
See [04-data-model.md](./04-data-model.md).

## Error handling pattern

Routes are wrapped in `try { ... } catch (error) { next(error) }`. The central error
handler:

- logs the full stack via the app logger (JSON),
- returns **401** when the error message is `User is not authentified`,
- returns **500** otherwise, echoing the raw error only for `TypeError: fetch failed`
  (so UIs can display upstream connectivity problems),
- anything else gets `{"error":"Something went wrong"}`.
