[Changelog en Français](./Change.log.fr.md)

# Changelogs

# 1.7.0

- **BREAKING CHANGE**: Changed the HTTP method for API input to "compare". The original method was not appropriate, as the function called alters the data, so it has been replaced by "PUT". If you use utdon in a "cron" task with curl, add the parameter: '-X PUT'.
- **BREAKING CHANGE**: Harmonization and improvement of server logs, **log content has changed**.
- Refactor login/logout, login returns a new cookie (fix session fixation).
- Several bugs fixed and methods refactored.
- Search by uuid or part of uuid.
- UserManager: The username field is inactive in "Edit" mode.
- Presentation of controls as table.
- Control duplication.
- Support for "Gitea" git repositories with authentication, enabling Github authentication for private projects, value (HTTP HEADER) Key: Authorization value: Bearer <You token>.
- Global Github authentication to remove the "rate-limit" barrier. The value is taken only if the control does not already have a specific authentication.
- For applications that don't offer a version level entry point, it is possible to enter the value of the version in use. This can also be used to track the evolution of an application that is not in production.
