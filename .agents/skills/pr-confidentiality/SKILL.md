---
name: pr-confidentiality
description: Mandatory confidentiality gate before publishing anything from this public repository. Use BEFORE any git push, branch publication, pull-request/PR creation, or public comment (PR description, issue reply, release notes). Detects secrets and tokens, internal/environment IP addresses, private hostnames, and production details in pending commits, working-tree changes, or any text about to be published. Use it even when the user only says "push", "publish", "create the PR" and does not mention confidentiality — this repo is public and their environment must stay private.
---

# PR Confidentiality Gate

This repository is **public** (AGPL-3.0). The maintainer's environment — internal IP
addresses, hostnames, tokens, production details — must never appear in published
commits, PRs, or comments. You are the last line of defense: **never push or publish
without running this check, and never push when it reports a finding.**

## What the check detects

- Secrets/tokens: GitHub tokens (`ghp_`, `github_pat_`, `gho_`...), AWS keys, Slack
  tokens, private key blocks, generic `password|secret|token|apikey = "value"` assignments.
- IP addresses in private/reserved ranges (10.x, 172.16-31.x, 192.168.x,
  169.254.x, 127.x — except the 127.0.0.1 allowlist). Public IPv4s are not
  flagged automatically (version strings look alike); add any specific public
  IP that must stay private to `HARDCDGREP` in `.envTest`.
- Confidential words: the user-curated `HARDCDGREP` word list from the git-ignored
  `.envTest` file (hostnames, usernames, internal network prefixes...).
- The literal value of `GITHUBTOKEN` from `.envTest`, if set.
- Sensitive filenames: `.envTest`, `.envlocaldev`, `envProxy`, `cacerts/`, `*.ca`, `data/*.json`.

## How to run it

Always run it from the repository root. Three modes:

```bash
# 1. BEFORE A PUSH / PR — scan pending commits + working tree (default mode)
.agents/skills/pr-confidentiality/scripts/checkConfidentiality.sh

# 2. BEFORE WRITING A PR DESCRIPTION — scan any text you are about to publish
.agents/skills/pr-confidentiality/scripts/checkConfidentiality.sh --file /tmp/pr-body.md

# 3. Explicit git range
.agents/skills/pr-confidentiality/scripts/checkConfidentiality.sh --range origin/main...HEAD
```

Exit codes: `0` clean, `1` findings (REFUSED), `2` usage error.

A git `pre-push` hook runs mode 1 automatically (install it with
`scripts/installGitHooks.sh` if missing) — but the hook only guards `git push`.
**You must still run mode 1 yourself before creating a PR**, and mode 2 on every
PR title/description and public comment you draft, because published *text* is
just as leaking-prone as published *code*.

## Interpreting results

Clean output looks like:

```
OK: no secrets, internal IP addresses, confidential words or sensitive files detected.
```

When findings exist, each line is `CATEGORY: file:line: matched-text`, for example:

```
SECRET/token: src/config.ts:42: const t = "ghp_redacted"
IP-ADDRESS: doc/notes.md:7: 203.0.113.7 is the proxy
CONFIDENTIAL-WORD/yourword: README.md:12: contact <confidential hostname>
SENSITIVE-FILE: .envlocaldev
REFUSED: confidential material detected above (file:line).
```

When the check reports findings:

1. **Stop.** Do not push, do not create the PR, do not post the text.
2. Show the findings to the user and propose a fix (remove the material, replace
   with placeholders, or rewrite the text).
3. After fixing, re-run the check and only proceed on `OK`.
4. If the confidential material is already in **earlier commits** of the branch,
   removing it needs a new commit at minimum — and **history rewriting is the
   user's decision**, never do it on your own initiative.

## Maintaining the word list

The custom words live in the git-ignored `.envTest` file (`HARDCDGREP` variable,
space-separated, case-sensitive fixed strings — matching the existing
`checkHardCoded.sh` convention). When the user mentions a new hostname, network
prefix, or identifier that must stay private, suggest adding it to `HARDCDGREP`
and update `.envTest` if they agree. Never commit `.envTest` itself, and never
copy its values into committed files, the skill, or documentation.
