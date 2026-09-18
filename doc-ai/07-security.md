# 07 — Security

This document describes the security-relevant behavior of the code as implemented.
The README's own guidance applies: run UTDON on a trusted internal network, behind a
reverse proxy providing HTTPS, and do not expose it to the Internet.

## Authentication

Dual-mode, both accepted by the global gate ([`src/main.ts:189-199`](../src/main.ts)):

1. **Session cookie** (`connect.sid`) — express-session with the default
   **MemoryStore** and a **random secret regenerated at each process start** (all
   sessions are dropped on restart; sessions live in RAM only, matching the
   in-RAM-database architecture). Used by the web UI.
2. **Bearer token** — per-user random 16-byte hex token, AES-encrypted at rest in
   `user.json`, retrieved via `GET /authtoken` and rotatable via `PUT /authtoken`.
   Intended for cron/CI. On a Bearer match, the server programmatically populates
   `req.session.user`, so downstream role checks work without a cookie.

- First boot creates **`admin`/`admin`** — change it immediately
  (`PUT /changepassword` from the UI). Password reset for a lost admin password:
  delete `data/user.json` and restart (documented in the README).
- Control create/update (`POST /control`) deliberately rejects Bearer auth with 403
  (UI-only operation).
- **Development bypass**: `environment=development` makes `isAuthSession` return
  true as admin for every request (with a logged warning). Never set in production.
- Login handler session lifecycle: the handler assigns `session.user`, then calls
  `session.regenerate()` whose callback calls `session.destroy()` — an unusual
  sequence (changelog 1.7.0 describes it as a session-fixation fix). See
  [10-code-observations.md](./10-code-observations.md).

## Authorization

- Single privileged group: **`admin`** (membership check in `Authentification.isAdmin`).
  User management and the global GitHub token are admin-only.
- Object-level: a non-admin may see/edit a control only if their groups intersect the
  control's `groups` (`isAllowedForObject`, `isRecordInUserGroups`). Group members are
  *full* managers of a control — there are no finer-grained permissions.
- `GET /control/all` and `PUT /action/compare/all/...` filter by the caller's groups;
  admins see/act on everything.

## Cryptography

| Concern | Implementation | Assessment |
|---|---|---|
| Password hashing | PBKDF2-SHA512, 1000 iterations, 64 bytes, hex; **salt = `USER_ENCRYPT_SECRET`, shared by all users** | Hashed, not plaintext — but the iteration count is low by current standards (OWASP suggests orders of magnitude more) and the salt is a single global secret rather than per-user. |
| Secrets at rest | AES-256-GCM (`Authentification.dataEncrypt/dataDecrypt`), key = `sha256(secret)`; covers user bearers, the six control secret fields, and the global GitHub token; files written mode `0600` | Two implementation caveats: the **IV is deterministic** (first 16 bytes of the same sha256 digest used for the key), and decryption **never verifies the GCM auth tag** (`final()`/`getAuthTag()` unused) — effectively encryption without GCM's integrity guarantee. Practical risk is limited (an attacker who can read the files can likely read the env secrets too), but it weakens the design intent. |
| Session secret | Random per boot | Restart invalidates all sessions (defense + operational trade-off). |

## Transport & network

- The server itself speaks **plain HTTP** (port 3015); TLS termination is expected at
  a reverse proxy (`doc/en/INSTALL.md`). Cookies do not set `secure`/`sameSite`
  explicitly.
- Outbound scraping supports corporate proxies (`HTTP_PROXY`/`HTTPS_PROXY`,
  `HttpsProxyAgent`/`HttpProxyAgent`) and TLS-intercepting proxies
  (`PROXYCA_CERT` under `cacerts/`). `NODE_TLS_REJECT_UNAUTHORIZED=0` disables
  certificate verification for outbound scrapes — several npm dev scripts hardcode it.
- `GET /api/v1/scrap/{url}` is an authenticated server-side fetch of arbitrary URLs
  (SSRF-style capability), usable only by authenticated users. It exists so the wizard
  can test extraction expressions without browser CORS issues.

## Headers & body limits

- Helmet with a minimal CSP: `defaultSrc 'self' 'unsafe-inline'`, `imgSrc 'self' data:`;
  other helmet middlewares at defaults.
- JSON bodies capped at 200 kb (`JSON_POST_MAX_SIZE`).
- CORS/OPTIONS shim sets allow-methods/allow-headers only; no `Access-Control-Allow-Origin`
  is ever emitted (same-origin SPA).

## Operational notes

- Data files (`data/*.json`, `data/globalGithubToken`) are written with mode `0600`;
  in Docker the volume must be writable by the container user (default `1001:1001`).
- `checkHardCoded.sh` is a local pre-commit guard that greps changed files for words
  listed in `.envTest`'s `HARDCDGREP` (custom secret/keyword detection).
- The test environment file `.envTest` (proxies, a GitHub token) is git-ignored; a
  sample is provided as `.envTest-sample`.
