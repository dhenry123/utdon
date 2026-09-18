# 09 — Build, Deployment & Release

## Local development

1. Server: `npm run startServer` (nodemon + tsx per [`nodemon.json`](../nodemon.json),
   `environment=development`) — note the dev npm scripts embed placeholder secrets
   (`USER_ENCRYPT_SECRET`, `DATABASE_ENCRYPT_SECRET=test`) and
   `NODE_TLS_REJECT_UNAUTHORIZED='0'`; there are `*WithProxy` variants that source
   `./envProxy`.
2. Client: run the Vite dev server in `client/` (port **7852**, `/api` proxied to
   `http://0.0.0.0:3015`).
3. `environment=development` also **bypasses authentication** (every request is admin)
   and points static serving at `client/dist/`.

## Builds

| Target | Command | Output |
|---|---|---|
| Server | `npm run build` = `rm -rf dist/* && environment=production tsc` | `dist/` (target ES2022, ESM, strict) |
| Client | `cd client && npm run build` = `tsc && vite build` | `client/dist` (with manifest) |

## Docker

### Production image — [`Dockerfile`](../Dockerfile)

- Multi-stage: `builder` (install deps → `npm run build` → prune to prod deps → build
  the client) → `runner`.
- Base: `node:22.22.3-alpine3.23`.
- Runner: OCI labels; non-root user/group `utdon` UID/GID `1001:1001` (overridable via
  `ARG RUNASUSER/RUNASUSERID/RUNASGROUP`); `USER 1001`; copies `dist/` → `/app`,
  `openapi.yaml`, prod `node_modules`, `client/dist` → `/app/public`; creates `/app/data`.
- `EXPOSE 3015`, `CMD ["node", "main.js"]`.

### Dev image — [`Dockerfile-dev`](../Dockerfile-dev)

Same server build; adds `curl` to the runner; **expects the client pre-built**
(`COPY ./client/dist/ ./public`).

### Volumes & ports

| Mount | Purpose |
|---|---|
| `/app/data` | JSON databases (user + controls). Owner must match the container UID/GID (default 1001:1001). |
| `/app/cacerts` | Extra CA certificates for TLS-intercepting proxies (breaking change introduced in 1.9.0). |

Port: container **3015** (`PORT` env overrides).

## Release publishing (manual)

- [`build-prod.sh`](../build-prod.sh): sources `.envlocaldev` (`CR_PAT`, `USERNAME`);
  `docker login ghcr.io`; per-platform `podman build` for `linux/amd64` and
  `linux/arm64` from `Dockerfile`, tagged `ghcr.io/${USERNAME}/utdon:${platform}-${TAG}`;
  `podman manifest create/push` → `ghcr.io/dhenry123/utdon:${TAG}` and `:latest`.
- [`build-dev.sh`](../build-dev.sh): builds the client, then `docker buildx` (arm64)
  from `Dockerfile-dev`, tagged and pushed to a local registry from `.envlocaldev`
  (`LOCALREGISTRY`, requires `jq`).

## CI — [`.github/workflows/docker-test.yml`](../.github/workflows/docker-test.yml)

"Docker Image CI": on push/PR to `main` (ubuntu-latest): checkout + `docker build .`
(smoke-build of the production image). **No test, lint, multi-arch or publish stage** —
the Jest suite is local-only by design (needs `.envTest`, proxies and live internet);
publishing is manual via `build-prod.sh`.

## Versioning & release process

- Semver, exposed at `GET /api/v1/version`; container/GitHub tags mirror the version;
  RC format `x.y.z-rc-n`.
- [`updateVersion.sh`](../updateVersion.sh) `[major|minor|patch]` (npm scripts
  `updateVersionMajor/Minor/Patch`): interactive confirmation →
  `npm version --no-git-tag-version` in root **and** `client/` → `sed` updates
  `APPLICATION_VERSION` in `src/Constants.ts`. Git tags are created manually.
- Bilingual changelogs: [`Change.log.md`](../Change.log.md) (EN) / `Change.log.fr.md`.
  ⚠️ As of 1.10.0 the changelog lags: latest entry is 1.9.0, and 1.8.0/1.10.0 are
  undocumented (see [10-code-observations.md](./10-code-observations.md)).
- [`checkHardCoded.sh`](../checkHardCoded.sh): pre-commit guard grepping changed files
  for words from `.envTest`'s `HARDCDGREP` list.
- [`install-legacy.sh`](../install-legacy.sh): bare-metal install to `/usr/local/utdon`
  (builds server + client, prunes dev deps), generates the two secrets with
  `openssl rand -base64 32`, prints a systemd unit template to stdout.

## Quick deploy reference (from `doc/en/INSTALL.md`)

```bash
docker run -d --name utdon \
  -p 3000:3015 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/cacerts:/app/cacerts \
  -e USER_ENCRYPT_SECRET="$(openssl rand -base64 32)" \
  -e DATABASE_ENCRYPT_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/dhenry123/utdon:<tag>
```

No HTTPS on the container — put a reverse proxy in front. Rootless by default
(1001:1001); a hardened variant (`-u USER:GROUP --read-only`) is documented in
`doc/en/INSTALL.md`.
