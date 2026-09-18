# 10 — Code Observations & Findings

Notable behaviors, quirks and potential issues identified while analyzing v1.10.0.
These are factual observations about the code as written — not bug reports; some may
be intentional design trade-offs.

## Behavior quirks

1. **Login session lifecycle is unusual** — [`src/routes/routerAuth.ts:34-49`](../src/routes/routerAuth.ts):
   the handler assigns `session.user`, then calls `req.session.regenerate(cb)` whose
   callback calls `req.session.destroy(cb)`. The comment ("no need to send info, login
   page is isolated, if user press F5 UI loose user infos") and the 1.7.0 changelog
   ("session fixation fix") suggest intent, but the sequence means login persistence
   depends on timing between the synchronous response and the async regenerate/destroy
   callbacks. Worth a deliberate review.

2. **`PUT /action/setstatus/` can hang** — [`src/routes/routerActions.ts:261-308`](../src/routes/routerActions.ts):
   when `req.body.uuid` is missing, no response is ever sent (the request hangs until
   client timeout).

3. **~~Version comparison is string-containment, not semver~~ FIXED in 1.11.0 (issue #26)** —
   `compareVersion` now orders by SemVer when both sides parse (see
   [`src/lib/Features.ts`](../src/lib/Features.ts) and
   [issues/issue-26-version-ordering.md](./issues/issue-26-version-ordering.md)); the
   legacy containment behavior remains only as the fallback for non-SemVer values,
   where the regex-metacharacter caveat still applies.

4. **Startup race on DB load** — [`src/main.ts:66-93`](../src/main.ts): the controls
   DB is loaded in an async continuation while `httpServer.listen()` is registered
   synchronously; early requests could observe a missing `app.get("DB")`. Benign in
   practice (load is fast), but the ordering is not enforced.

5. **`GET /metrics` returns 503** — declared in the router as not implemented (roadmap).

6. **Log helper quirk** — [`src/lib/logs.ts:25-27`](../src/lib/logs.ts): extra `uuid`
   and `scrapResponse` fields overwrite the `message` field in log objects.

## Security-relevant observations

7. **Deterministic IV + unverified GCM tag in secret encryption** —
   [`src/lib/Authentification.ts:396-443`](../src/lib/Authentification.ts):
   `dataEncrypt` derives both key and IV from `sha256(secret)` (IV = first 16 bytes of
   the key digest) and `dataDecrypt` never calls `final()`/`getAuthTag()`. Two
   ciphertexts of the same plaintext under the same secret are identical, and tampering
   is not detected. See [07-security.md](./07-security.md).

8. **Password hashing parameters** — PBKDF2-SHA512 with 1000 iterations and the global
   `USER_ENCRYPT_SECRET` as salt for **all** users
   ([`src/lib/Authentification.ts:77-93`](../src/lib/Authentification.ts)). Consider
   per-user salts and a higher iteration count (or scrypt/argon2).

9. **Development auth bypass** — `environment=development` makes every request admin
   ([`src/lib/Authentification.ts:265-289`](../src/lib/Authentification.ts)). Several
   root npm scripts set this value; ensure it can never leak into a deployment.

10. **Session cookie flags** — no explicit `secure`/`sameSite` on the session cookie
    ([`src/main.ts:133-139`](../src/main.ts)); safe only behind the documented
    reverse-proxy deployment.

11. **`GET /api/v1/scrap/{url}`** is an authenticated SSRF-style open fetch (arbitrary
    URL, pass-through header). Restricted to authenticated users by design; keep the
    trust boundary in mind.

12. **Dev scripts embed secrets** — [`package.json`](../package.json) `startServer*`
    scripts hardcode a 32-char hex `USER_ENCRYPT_SECRET` placeholder (already public in
    git history — redacted here on purpose), `DATABASE_ENCRYPT_SECRET=test` and
    `NODE_TLS_REJECT_UNAUTHORIZED='0'`. Convenient for dev, but the same strings are in
    git history.

## Documentation / consistency lag

13. **`openapi.yaml` lags the implementation** — `info.version: 1.5.0` vs app 1.11.0;
    only 7 of the ~26 paths are documented (no auth/user/group endpoints, no `/scrap`).
    This file (doc-ai) is currently the complete API reference.

14. **Changelog** — partially resolved in 1.11.0: the missing 1.10.0 entries were
    reconstructed and 1.11.0 is documented (EN/FR); **1.8.0 still has no entry**.

15. **`install-legacy.sh` mentions Node LTS-20** while the Docker images and README
    use Node 22.22.3.

16. **`test/cacerts` path typo** — `scrapUrlServer.test.ts:18` sets
    `NODE_EXTRA_CA_CERTS` to `${cwd}/tests/cacerts` (plural), but the directory is
    `test/cacerts`.

17. **Docs Docker example** (`doc/en/INSTALL.md`) still uses `tag="1.9.0"` and one
    generic example omits the `cacerts` volume mount (present in surrounding text).

## Minor / cosmetic

18. **`Constants-dev.ts`** contains Storybook fixtures never imported by the server,
    and duplicates application-shape constants rather than importing them — and
    Storybook itself was removed in 1.10.0, making the file fully orphaned.

19. **Client RTK Query `deleteUser`** names its parameter `login` but sends a **uuid**
    ([`client/src/api/mytinydcUPDONApi.ts:168-175`](../client/src/api/mytinydcUPDONApi.ts);
    caller passes `userToDelete.uuid` in `UserManager.tsx:145`). Works, but misleading.

20. **Unused fixtures** — `test/samples/tags-reponse-github-tags.json` and
    `test/samples/database.json` are not referenced by any current test.

21. **`helperProdVersionReader.filterJson` stringifies all numbers** before JMESPath
    evaluation ([`src/lib/helperProdVersionReader.ts:36-52`](../src/lib/helperProdVersionReader.ts))
    — clever (enables `join('.', *)` on numeric fields) but surprising: extracted
    values are always strings, and a JSON document whose semantics depend on numeric
    types would behave differently than expected.

22. **Client `helpers/scrapUrl.ts` is dead code** — direct browser scraping was
    replaced by the server-side `/scrap` endpoint; the helper remains.

23. **Cross-tree client imports** — the client builds against `../../src/**` and
    `locales/fr.json` (see [06-client-architecture.md](./06-client-architecture.md)).
    Intentional (shared extraction logic/types), but `client/` cannot be built
    standalone and refactors of `src/` can break the client build.
