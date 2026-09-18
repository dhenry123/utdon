[Changelog en Français](./Change.log.fr.md)

# Changelogs

# 1.11.0

- Fix #26: the latest release is now selected by the greatest SemVer tag, not by the first entry of the GitHub/Gitea releases list. Forges order releases by creation id, so a backport published after a newer release (e.g. VictoriaLogs v1.51.1 after v1.52.0) was wrongly detected as "latest". Non-SemVer versioning schemes keep the previous behavior.
- Fix #26: a production version **greater** than the latest detected release is no longer reported "TO UPDATE"; it is displayed with a gray "Unknown" badge and a new field `productionVersionIsGreater` in the comparison result.
- SemVer-aware comparison (v-prefix tolerance, pre-release precedence) when both versions parse as SemVer; legacy string-containment behavior is kept as a fallback.
- **BEHAVIOR CHANGE**: for repositories maintaining several version streams (e.g. 1.x LTS and 2.x) without a keep-regexp, the greatest version now wins. Use the "keep only releases which match this pattern" filter to track a specific stream.
- UI: the control wizard "latest available version detected" preview now applies the same selection as the server.
- UI tests: new Vitest + React Testing Library suite for the client (56 tests).
- Tests: minimal local proxy (`npm run startLocalProxy`) so the server test suite can run without a corporate proxy.
- Client dependencies: vite 8, @vitejs/plugin-react 6, @reduxjs/toolkit 2, react-redux 9, react-router-dom 7, react-intl 12 — `npm audit` now reports 0 vulnerabilities (was 4).
- Server dependencies refreshed.

# 1.9.0

- NodeJS 20.18
- Corporate proxy support.
- Improved SSL security, linked to the implementation of corporate proxy support.
- **BREAKING CHANGE**: A new volume has been added: “cacerts”, mounted on “/app/cacerts”.
- **BREAKING CHANGE**: If you're monitoring HTTPS services with self-signed certificates, you must install CA certificates in the “cacerts” directory or disable SSL control by passing the environment variable: `NODE_TLS_REJECT_UNAUTHORIZED=“0”`.
- Improved unit testing.
- Typo.

# 1.7.0

- **BREAKING CHANGE**: Changed the HTTP method for API input to "compare". The original method was not appropriate, as the function called alters the data, so it has been replaced by "PUT". If you use utdon in a "cron" task with curl, add the parameter: '-X PUT'.
- **BREAKING CHANGE**: Harmonization and improvement of server logs, **log content has changed**.
- Refactor login/logout, login returns a new cookie (fix session fixation).
- Several bugs fixed and methods refactored.
- Search by uuid or part of uuid.
- UserManager: The username field is inactive in "Edit" mode.
- Presentation of controls as table.
- Control duplication.
- Support for "Gitea" git repositories with authentication, enabling GitHub authentication for private projects, value (HTTP HEADER) Key: Authorization value: "Bearer <You token>".
- Global GitHub authentication to remove the "rate-limit" barrier. The value is taken only if the control does not already have a specific authentication.
- For applications that don't offer a version level entry point, it is possible to enter the value of the version in use. This can also be used to track the evolution of an application that is not in production.
