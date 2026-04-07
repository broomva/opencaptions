#!/usr/bin/env bash
set -euo pipefail

# check-docs-freshness.sh — Verify documentation index coverage
# Usage: make -f Makefile.control docs-check

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

DOCS_DIR="$REPO_ROOT/docs"
INDEX_FILE="$DOCS_DIR/_index.md"

echo "=== Docs Freshness Check ==="

if [ ! -d "$DOCS_DIR" ]; then
  echo "  WARN: docs/ directory does not exist yet. Skipping."
  exit 0
fi

if [ ! -f "$INDEX_FILE" ]; then
  echo "  WARN: docs/_index.md does not exist yet. Skipping."
  exit 0
fi

MISSING=()

while IFS= read -r -d '' doc; do
  rel_path="${doc#"$DOCS_DIR"/}"

  if [[ "$rel_path" == _templates/* ]]; then
    continue
  fi

  if [[ "$rel_path" == "_index.md" ]]; then
    continue
  fi

  basename_no_ext="${rel_path%.md}"
  if ! grep -q "$basename_no_ext" "$INDEX_FILE" && ! grep -q "$rel_path" "$INDEX_FILE"; then
    MISSING+=("$rel_path")
  fi
done < <(find "$DOCS_DIR" -name '*.md' -print0 | sort -z)

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "  ERROR: The following docs are NOT referenced in docs/_index.md:"
  for m in "${MISSING[@]}"; do
    echo "    - $m"
  done
  echo ""
  echo "  Add references to these files in docs/_index.md."
  exit 1
fi

echo "  All docs are referenced in _index.md."
echo "=== Docs freshness check passed ==="
