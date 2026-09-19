#!/bin/bash
# @author DHENRY for mytinydc.com
# @license AGPL3
#
# Install the git pre-push hook that runs the confidentiality check
# before every push. Idempotent — safe to run multiple times.
set -e
cd "$(git rev-parse --show-toplevel)"

HOOK=".git/hooks/pre-push"
cat > "$HOOK" <<'EOF'
#!/bin/bash
# Confidentiality gate: refuse pushes containing secrets, internal IPs,
# confidential words or sensitive files. See .agents/skills/pr-confidentiality/
exec "$(git rev-parse --show-toplevel)/.agents/skills/pr-confidentiality/scripts/checkConfidentiality.sh"
EOF
chmod +x "$HOOK"
echo "Installed $HOOK"
