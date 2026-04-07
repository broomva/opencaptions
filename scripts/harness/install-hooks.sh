#!/usr/bin/env bash
set -euo pipefail

# install-hooks.sh — Install git hooks
# Usage: make -f Makefile.control hooks-install

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "No .git directory found. Skipping hook installation."
  exit 0
fi

mkdir -p "$HOOKS_DIR"

cp "$REPO_ROOT/scripts/harness/pre-commit.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed:"
echo "  - pre-commit -> scripts/harness/pre-commit.sh"
