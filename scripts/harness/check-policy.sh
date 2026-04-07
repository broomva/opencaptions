#!/usr/bin/env bash
set -euo pipefail

# check-policy.sh — Policy compliance checker for staged changes
# Usage: make -f Makefile.control policy-check

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== Policy Compliance Check ==="

# Get staged files (or all changed files if not in a git context)
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  STAGED=$(git diff --cached --name-only 2>/dev/null || git diff --name-only HEAD 2>/dev/null || true)
else
  echo "  Not in a git repository. Skipping policy check."
  exit 0
fi

if [ -z "$STAGED" ]; then
  echo "  No staged files. Nothing to check."
  exit 0
fi

WARNINGS=0

# Policy: database-migration
if echo "$STAGED" | grep -q "packages/database/prisma/schema.prisma\|packages/database/prisma/migrations"; then
  echo ""
  echo "  [HIGH RISK] Database migration detected!"
  echo "    - Required: ADR in docs/decisions/ explaining the change"
  echo "    - Required: Tests covering the migration"
  echo "    - Required: Database backup before production apply"
  WARNINGS=$((WARNINGS + 1))
fi

# Policy: dependency-update
if echo "$STAGED" | grep -q "package.json\|bun.lock"; then
  echo ""
  echo "  [MEDIUM RISK] Dependency change detected!"
  echo "    - Recommended: Run audit"
  echo "    - Required: Full build and test pass"
  WARNINGS=$((WARNINGS + 1))
fi

# Policy: env-variable-change
if echo "$STAGED" | grep -qE "\.env\.example|\.env\.local\.example|env\.ts|keys\.ts"; then
  echo ""
  echo "  [HIGH RISK] Environment variable change detected!"
  echo "    - Required: Update docs/schemas/env-variables.md"
  echo "    - Required: Add Zod validation in env.ts"
  echo "    - WARNING: Never commit actual secret values"
  WARNINGS=$((WARNINGS + 1))
fi

# Policy: new-package
if echo "$STAGED" | grep -qE "^(packages|apps)/[^/]+/package\.json$"; then
  NEW_PKGS=$(echo "$STAGED" | grep -E "^(packages|apps)/[^/]+/package\.json$" || true)
  for pkg in $NEW_PKGS; do
    if ! git show HEAD:"$pkg" > /dev/null 2>&1; then
      echo ""
      echo "  [MEDIUM RISK] New package detected: $pkg"
      echo "    - Required: Update .control/topology.yaml"
      echo "    - Required: Add architecture doc in docs/architecture/"
      echo "    - Required: Update docs/_index.md"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
fi

echo ""
if [ "$WARNINGS" -gt 0 ]; then
  echo "  Found $WARNINGS policy warning(s). Review before proceeding."
  echo "  (Policy checks are advisory — they do not block commits.)"
else
  echo "  No policy warnings."
fi

echo "=== Policy check complete ==="
