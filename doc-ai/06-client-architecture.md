# 06 — Client Architecture

SPA in [`client/`](../client/) (package `mytinydc-utdon-client`, version locked to the
server's). No UI framework — a hand-rolled component kit in `client/src/components/`
with per-component SCSS files.

## Stack, build & serving

- React 18.3 + TypeScript 5.9 + **Vite 8** (`@vitejs/plugin-react` 6, Sass modern-compiler).
- **Redux Toolkit 2** + RTK Query; **react-router-dom 7** (`createBrowserRouter` + route
  loaders); **react-intl 12**; `@tabler/icons-webfont`; `react-multi-select-component`
  (unmaintained at React ≤18 — the blocker for a React 19 upgrade).
- Tests: **Vitest 5 + React Testing Library** (`npm test` in `client/` → `vitest run`,
  57 tests; jsdom environment, config in `vite.config.ts`, setup in `src/test/setup.ts`).
- `npm run build` = `tsc && vite build` → `client/dist` (with manifest).
- Dev: Vite dev server on `0.0.0.0:7852`, `/api` proxied to `http://0.0.0.0:3015`
  ([client/vite.config.ts](../client/vite.config.ts)); the Express server runs
  separately (nodemon/tsx via root npm scripts).
- Production: `client/dist` is copied to `/app/public` in the Docker image and served
  by Express on the SPA routes (see [02-server-architecture.md](./02-server-architecture.md)).
- `client/tools/addComponents.sh` scaffolds new components from a template.

### Shared code imported from the server tree

The client imports **outside `client/`**: `src/Global.types.ts`, `src/Constants.ts`,
`src/lib/helperProdVersionReader.ts` (regex/JMESPath extraction),
`src/lib/helperGitRepository.ts` (repo-type detection, releases-URL building), and
`locales/fr.json`. This keeps version extraction and types identical between the
wizard previews and the server-side compare — but it means the client cannot be built
from `client/` alone.

### i18n

`IntlProvider` wraps the router ([client/src/App.tsx](../client/src/App.tsx)). Message
keys are English sentences; `en` maps to `{}` (keys render as-is) and `fr` loads
`locales/fr.json` (via `contextSlice`). Browser language is detected on mount
(non-`fr` → `en`); `onError` silenced.

## State management

Store ([client/src/app/store.ts](../client/src/app/store.ts)): reducers `context`,
`servicemessage`, `[api.reducerPath]` + RTK Query middleware. Typed hooks in
`app/hook.ts`.

### `contextSlice` ([client/src/app/contextSlice.ts](../client/src/app/contextSlice.ts))

| State | Purpose |
|---|---|
| `language` | `{locale, lang}` |
| `application` | name/copyright/license metadata |
| `uptodateForm` | The control being created/edited (whole `UptodateForm`, initialized from `INITIALIZED_UPTODATEFORM`); reducers `updateKeyUptodateFrom`, `setUpdateForm`, `resetUpdateForm` |
| `refetchuptodateForm` | Cross-component refetch signal (Header refresh button → `DisplayControls`) |
| `isAdmin` | Mirrored from `GET /isadmin` |
| `search` | Dashboard filter string |
| `isLoaderShip` | Global loading overlay |
| `displayControlsType` | `cards` \| `table`, persisted in `localStorage.displayControlsAsList` |
| `authToken` | The user's API token (for curl-command dialogs) |

### `serviceMessageSlice`

Single `toast` object; `showServiceMessage` stamps a timestamp; rendered globally by
`ServiceMessage` → `Toast` (stacked, sticky or timed).

### RTK Query API ([client/src/api/mytinydcUPDONApi.ts](../client/src/api/mytinydcUPDONApi.ts))

`reducerPath: "api"`, `baseUrl: "/api/v1"`, tagTypes:
`User, Users, Groups, Controls, AuthToken, GlobalGithubToken`. **No polling** —
freshness via cache invalidation, manual `refetch()` and `forceRefetch: true`.

| Hook/mutation | Call | Notes |
|---|---|---|
| `postUserLogin` | POST `/userlogin` | invalidates User/Controls/AuthToken |
| `getUserIsAuthenticated` | GET `/isauthenticated/` | used as the home route **loader** |
| `getUserLogout` | GET `/userlogout` | |
| `getScrapUrl` | GET `/scrap/{encodeURIComponent(url)}` | optional `scrapurlheader` header (`helpers/rtk.ts`); response read as **text** |
| `postUptodateForm` | POST `/control` | create/update control |
| `putCompare` | PUT `/action/compare/{uuid}/0` | run comparison |
| `getControl` | GET `/control/{uuidOrAll}` | provides `Controls` |
| `deleteCheck` | DELETE `/control/{uuid}` | |
| `sendStateExternalMonitoring` | PUT `/action/setstatus/` | body `{uuid, state}` |
| `callCiCd` | PUT `/action/cicd/` | body `{uuid}` |
| `putChangePassword` | PUT `/changepassword/` | |
| `getAuthToken` / `putAuthToken` | GET / PUT `/authtoken/` | read / rotate API token |
| `getUserLogin` | GET `/userlogin/` | session rehydration after F5 |
| `getUsers` / `postUser` / `putUser` / `deleteUser` | GET/POST/PUT/DELETE `/users…` | admin user management; `deleteUser` sends the user's **uuid** (parameter is misleadingly named `login`) |
| `getGroups` / `getUserGroups` | GET `/groups/`, `/userGroups/` | |
| `isAdmin` | GET `/isadmin/` | |
| `pubGlobalgithubtoken` / `getGlobalgithubtoken` | PUT / GET `/globalgithubtoken/` | |

## Routing ([client/src/app/Router.tsx](../client/src/app/Router.tsx))

| Route | Component | Notes |
|---|---|---|
| `/` | `PageHome` (Header + `<Outlet/>`) | **Route loader** dispatches `getUserIsAuthenticated`; a 401 renders `PageLogin` as the loader result |
| `/` (index child) | `DisplayControls` | Dashboard |
| `/ui/addcontrol` | `ControlManager` | Wizard, create mode |
| `/ui/editcontrol/:uuid` | `ControlManager` | Wizard, edit mode |
| `/login` | `PageLogin` | |
| *any* | `ErrorInRouter` | `errorElement` |

Protection is layered: the loader check above, per-feature 401 → redirect to `/login`
from `dispatchServerError`, and the server-side gate. `ChangePassword`, `UserManager`,
`CurlCommands`, `GlobalGithubToken` are **not routes** — they render inside Header /
dashboard dialogs.

## Feature pages (`client/src/features/`)

- **`login/PageLogin`** — login/password → `postUserLogin`; on success navigates to
  `/`; footer links to `/api/doc` and prints `APPLICATION_VERSION`.
- **`displaycontrols/DisplayControls`** — the dashboard: `useGetControlQuery("all")`,
  cards (`Control`) or table (persisted toggle), filtered by `context.search` (regex on
  name/uuid). Per-control actions: edit, duplicate (copy with `name + " (copy)"`, new
  uuid on save, nulled compareResult), delete, pause/enable (`isPause`), compare now
  (with global loader overlay), view last result (`ResultCompare` dialog), curl
  commands (`CurlCommands` dialog).
- **`controlmanagement/ControlManager`** — the 4-step wizard (`Stepper`):
  1. *Service to be monitored* (`ScrapProduction`) — logo upload, name, groups
     multiselect (admins pick from all groups; normal users get their own), production
     URL + optional auth header, or a mutually exclusive **fixed version**; "Get
     Content" fetches **through the server** (`/scrap`) then applies the regex/JMESPath
     live with preset samples from `helpers/ExprSamples.ts`.
  2. *Git repository* (`ScrapGitHubReleaseTags`) — GitHub/Gitea URL + optional auth
     header; derives the releases API URL with the shared helpers, lists tags, applies
     a keep-regexp (with `$1` substitution), shows matched/excluded lists and the
     detected latest release.
  3. *Action to perform* (`ActionsSettings`) — monitoring URL + method + auth header;
     CI/CD URL + method + auth header. All optional.
  4. *Summary* — read-back; Save (`postUptodateForm`) then Compare (`putCompare`)
     with result dialog. In edit mode the control is force-fetched into
     `context.uptodateForm` and all steps marked done.
- **`usermanager/UserManager`** (admin-only dialog) — create/edit users (login,
  password, creatable groups multiselect), users table, delete with confirmation;
  admin and self are protected from deletion/editing.
- **`curlcommands/CurlCommands`** — ready-to-copy curl commands for a control or
  `all`, using the user's API token: compare (`/0` and `/1`), last git release,
  CI/CD call, control retrieval, all-controls, version.
- **`changepassword/ChangePassword`** (Header dialog) — change password; "Renew API
  authentication token" with a strong warning confirm.
- **`homepage/PageHome`**, **`errors/ErrorInRouter`** — layout / error dump.

## Component inventory (`client/src/components/`)

Control-wizard & dashboard:

| Component | Role |
|---|---|
| `Header` | Toolbar: refresh, add control, API doc link, general curl commands, search, admin-only user-manager & global-token buttons, change password, cards/table toggle, logout; hosts a generic `Dialog` whose content swaps; on mount fetches login, auth token (mirrored to context), and `isAdmin` |
| `Control` | Dashboard card: logo, name, uuid, groups (admin only), URLs, latest badge + `DisplayVersions` |
| `ControlGroupButtons` | Edit / duplicate / delete / curl / compare buttons + pause checkbox |
| `Stepper` / `StepperStep` | Wizard step indicators and panels |
| `ScrapProduction` | Wizard step 1 (see above) |
| `ScrapGitHubReleaseTags` | Wizard step 2 |
| `ActionsSettings` | Wizard step 3 |
| `Summary` | Wizard step 4 |
| `DisplayVersions` | Inline `productionVersion / githubLatestRelease` readout |
| `ResultCompare` | Last-compare dialog: versions, relative time, badge, false-positive warnings, and Operations: send status to monitoring / trigger CI/CD (disabled when paused or unset) |
| `GlobalGithubToken` | Admin dialog for the global PAT (≥40 chars, show/hide, confirm) |
| `CurlCommands`-support: `FieldSetApiEntrypoint` | One curl block: absolute URL from `window.location`, method, optional `-k`, optional `-H "Authorization: …"`, JSON body, copy button |
| `FieldSetAuthorizationHeader` | Shows/copies the user's `Authorization` header value |
| `HttpHeader` | key/value inputs for an optional HTTP auth header |
| `ImageUploader` | Drag&drop logo (png/jpg/jpeg, size-limited, base64 into the form) |

Generic kit: `Block`, `FieldSet`, `FieldSetClickableUrl`, `ButtonGeneric`,
`InputGeneric`, `InputIcon`, `SelectGeneric`, `CheckBox`, `Badge` (UP to date /
OUT of date / No State + warn variant), `Dialog` (also reused as the global loader
overlay), `ConfirmDialog`, `Toast`/`ServiceMessage`, `Search`, `LoginBlock`,
`UrlOpener`/`UrlLinkButtons` (per-domain tab names), `IconWithTooltip`.

## Helpers (`client/src/helpers/`)

| File | Role |
|---|---|
| `scrapUrl.ts` | Direct browser `fetch` returning text only (anti-XSS); currently unused — the wizard routes scraping through the server `/scrap` endpoint |
| `DateHelper.ts` | `getRelativeTime(ts, intl)` — absolute date + `Intl.RelativeTimeFormat` |
| `UiMiscHelper.ts` | `copyToClipboard` (hidden-textarea `execCommand`), `buidMultiSelectGroups`, `convertUrlToTabName` |
| `ExprSamples.ts` | Preset dropdown options: JMESPath/regex production samples, GitHub tag keep-patterns |
| `rtk.ts` | `buildHeader(value)` → `{ scrapUrlHeader: "key:value" }` for `/scrap` |
