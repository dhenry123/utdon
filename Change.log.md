[Changelog en Français](./Change.log.fr.md)

# Changelogs

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
