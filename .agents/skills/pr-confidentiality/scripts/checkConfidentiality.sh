#!/bin/bash
# @author DHENRY for mytinydc.com
# @license AGPL3
#
# Confidentiality gate for a PUBLIC repository.
# Scans what is about to be published (pending commits, working tree,
# or a single file such as a PR description) for:
#   - secrets and tokens (GitHub, AWS, Slack, private keys, generic assignments)
#   - IP addresses (allowlist: 127.0.0.1, 0.0.0.0, 255.255.255.255)
#   - user-curated confidential words (HARDCDGREP in the git-ignored .envTest)
#   - the literal value of GITHUBTOKEN from .envTest, if set
#   - sensitive filenames (.envTest, .envlocaldev, envProxy, cacerts, ...)
#
# Exit codes: 0 = clean, 1 = confidential material found, 2 = usage error.
#
# Usage:
#   checkConfidentiality.sh                    # pending commits + working tree
#   checkConfidentiality.sh --range A...B      # explicit git range
#   checkConfidentiality.sh --file <path>      # scan one file (PR text, ...)

set -u

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: not inside a git repository" >&2
  exit 2
}

MODE="range"
RANGE=""
SCAN_FILE=""

# ---------------------------------------------------------------------------
# argument parsing
# ---------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --range)
      [ -z "${2:-}" ] && { echo "usage: --range <git-range>" >&2; exit 2; }
      MODE="range"; RANGE="$2"; shift 2 ;;
    --file)
      [ -z "${2:-}" ] && { echo "usage: --file <path>" >&2; exit 2; }
      MODE="file"; SCAN_FILE="$2"; shift 2 ;;
    *) echo "usage: $0 [--range <git-range>] [--file <path>]" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# collect the lines to scan as  file:line:text
# ---------------------------------------------------------------------------
collect_added_lines() {
  if [ "$MODE" = "file" ]; then
    awk -v f="$SCAN_FILE" '{ print f ":" NR ":" $0 }' "$SCAN_FILE"
  else
    if [ -z "$RANGE" ]; then
      if git rev-parse --verify '@{u}' >/dev/null 2>&1; then
        RANGE="@{u}..HEAD"
      elif git rev-parse --verify origin/main >/dev/null 2>&1; then
        RANGE="origin/main...HEAD"
      fi
    fi
    # committed pending changes
    if [ -n "$RANGE" ]; then
      git diff -U0 "$RANGE" 2>/dev/null
    fi
    # uncommitted (staged + unstaged) changes
    git diff -U0 HEAD -- 2>/dev/null
  fi
}

DIFFS=$(collect_added_lines)

emit_added_lines() {
  # file mode: lines are already file:line:text
  if [ "$MODE" = "file" ]; then
    printf '%s\n' "$DIFFS"
    return
  fi
  printf '%s\n' "$DIFFS" | awk '
    /^diff --git/       { file=""; next }
    /^new file mode/    { next }
    /^index /           { next }
    /^--- /             { next }
    /^\+\+\+ b\//       { file=substr($0, 7); next }
    /^\+\+\+/           { next }
    /^@@ / {
      # $3 is +start,count — position on the first added/context line
      split($3, h, ","); line=substr(h[1], 2); next
    }
    /^\+/ { if (file != "") print file ":" line ":" substr($0, 2); line++; next }
    /^ /  { line++; next }
    /^-/  { next }
  '
  # working-tree untracked files (never in a diff)
  if [ "$MODE" != "file" ]; then
    git ls-files --others --exclude-standard \
      | grep -vE '(^|/)(node_modules|dist)(/|$)' \
      | while read -r f; do
          [ -f "$f" ] && awk -v f="$f" '{ print f ":" NR ":" $0 }' "$f"
        done
  fi
}

LINES=$(emit_added_lines)
# The skill's own files must document the detection patterns (token prefixes,
# regexes, example findings) — exclude them from scanning, like most scanners
# exclude their own config.
LINES=$(printf '%s\n' "$LINES" | grep -v '^[^:]*\.agents/skills/pr-confidentiality/' || true)

# ---------------------------------------------------------------------------
# detectors — each prints matching  file:line:text  lines
# ---------------------------------------------------------------------------
detect() {
  local label="$1"; shift
  local flags=""
  if [ "${1:-}" = "-i" ]; then flags="-i"; shift; fi
  local matches
  matches=$(printf '%s\n' "$LINES" | grep -E $flags -- "$@" 2>/dev/null || true)
  [ -n "$matches" ] && printf '%s\n' "$matches" | sed "s|^|$label: |"
  [ -n "$matches" ]
}

FOUND=0
record() { FOUND=1; }

# --- secrets & tokens -------------------------------------------------------
if detect "SECRET/token" 'ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|ghu_[A-Za-z0-9]{20,}|ghs_[A-Za-z0-9]{20,}|ghr_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}'; then record; fi
if detect "SECRET/aws-key" 'AKIA[0-9A-Z]{16}'; then record; fi
if detect "SECRET/slack-token" 'xox[baprs]-[A-Za-z0-9-]{10,}'; then record; fi
if detect "SECRET/private-key" 'BEGIN [A-Z ]*PRIVATE KEY'; then record; fi
# generic credential assignments with a literal value (password = "...")
if detect "SECRET/assignment" -i '(password|passwd|secret|token|api[_-]?key)[[:space:]]*[=:][[:space:]]*["'"'"']?[A-Za-z0-9/+=_-]{8,}'; then record; fi

# --- IP addresses: private/reserved ranges only (environment leak risk) ------
# Full 4-octet shape required, in: 10/8, 172.16-31/12, 192.168/16,
# 169.254/16 link-local, 127/8 loopback (127.0.0.1 allowlisted).
# Public IPv4s are intentionally not flagged (version strings like "1.52.0.4"
# look alike); add specific public IPs to HARDCDGREP in .envTest instead.
ips=$(printf '%s\n' "$LINES" | grep -E '([^0-9.]|^)((10|127)\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|169\.254\.[0-9]{1,3}\.[0-9]{1,3})([^0-9.]|$)' 2>/dev/null \
  | grep -vE '(^|[^0-9.])127\.0\.0\.1([^0-9.]|$)' || true)
if [ -n "$ips" ]; then
  printf '%s\n' "$ips" | sed 's|^|IP-ADDRESS: |'
  record
fi

# --- user-curated words (HARDCDGREP) + literal token value ------------------
ENVTEST=".envTest"
if [ -f "$ENVTEST" ]; then
  # shellcheck disable=SC1090
  HARCODEDGREPWords=$(grep -E '^HARCODEDGREP' "$ENVTEST" | head -1 | sed -E 's/^[^=]*=//; s/^["'"'"']//; s/["'"'"']$//')
  for word in $HARCODEDGREPWords; do
    matches=$(printf '%s\n' "$LINES" | grep -F -- "$word" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      printf '%s\n' "$matches" | sed "s|^|CONFIDENTIAL-WORD/$word: |"
      record
    fi
  done
  GHTOKEN=$(grep -E '^GITHUBTOKEN' "$ENVTEST" | head -1 | sed -E 's/^[^=]*=//; s/^["'"'"']//; s/["'"'"']$//')
  if [ -n "$GHTOKEN" ] && [ ${#GHTOKEN} -ge 20 ]; then
    matches=$(printf '%s\n' "$LINES" | grep -F -- "$GHTOKEN" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      printf '%s\n' "$matches" | sed 's|^|SECRET/githubtoken-value: |'
      record
    fi
  fi
fi

# --- sensitive filenames ------------------------------------------------------
if [ "$MODE" != "file" ]; then
  names=""
  [ -n "$RANGE" ] && names=$(git diff --name-only "$RANGE" 2>/dev/null || true)
  wt=$(git diff --name-only HEAD -- 2>/dev/null || true)
  [ -n "$wt" ] && names=$(printf '%s\n%s\n' "$names" "$wt")
  sensitive=$(printf '%s\n' "$names" | grep -E '(^|/)\.env|^envProxy|(^|/)cacerts/|\.ca$|^data/.*\.json' || true)
  if [ -n "$sensitive" ]; then
    printf '%s\n' "$sensitive" | sed 's|^|SENSITIVE-FILE: |'
    record
  fi
fi

# ---------------------------------------------------------------------------
# verdict
# ---------------------------------------------------------------------------
if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "REFUSED: confidential material detected above (file:line)."
  echo "Do NOT push / publish. Remove the material, then re-run this check."
  exit 1
fi

echo "OK: no secrets, internal IP addresses, confidential words or sensitive files detected."
exit 0
