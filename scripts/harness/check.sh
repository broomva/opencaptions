#!/usr/bin/env bash
set -euo pipefail

# check.sh — Lint + typecheck
# Usage: make -f Makefile.control check
# Timeout: ~60s

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== Check: Lint + Typecheck ==="
echo ""

echo "[1/2] Running lint..."
bun run check
echo ""

echo "[2/2] Running TypeScript typecheck..."
bunx tsc --noEmit
echo ""

echo "=== All checks passed ==="
