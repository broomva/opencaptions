#!/usr/bin/env bash
set -euo pipefail

# check-wikilinks.sh — Validate [[wikilinks]] in docs/*.md files
# Usage: make -f Makefile.control wikilinks-check

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

DOCS_DIR="$REPO_ROOT/docs"

echo "=== Wikilink Validation ==="

if [ ! -d "$DOCS_DIR" ]; then
  echo "  WARN: docs/ directory does not exist yet. Skipping."
  exit 0
fi

BROKEN=()
CHECKED=0

while IFS= read -r -d '' doc; do
  while IFS= read -r link; do
    target="${link%%|*}"
    target="${target%%#*}"

    if [ -z "$target" ]; then
      continue
    fi

    if [[ "$target" == ...* ]]; then
      continue
    fi

    if [[ "$target" == *NNN* ]] || [[ "$target" == *XXX* ]]; then
      continue
    fi

    if [[ "$target" == "wikilinks" ]] || [[ "$target" == "internal-link" ]]; then
      continue
    fi

    target="${target%%#*}"
    target="${target%/}"

    if [ -z "$target" ]; then
      continue
    fi

    CHECKED=$((CHECKED + 1))

    target_file="$DOCS_DIR/${target}.md"
    target_dir="$DOCS_DIR/${target}"

    if [ ! -f "$target_file" ] && [ ! -d "$target_dir" ]; then
      rel_doc="${doc#"$REPO_ROOT"/}"
      BROKEN+=("$rel_doc -> [[${target}]] (expected: docs/${target}.md)")
    fi
  done < <(
    sed '/^```/,/^```/d' "$doc" \
      | sed 's/`[^`]*`//g' \
      | grep -oE '\[\[[^]]+\]\]' 2>/dev/null \
      | sed 's/^\[\[//; s/\]\]$//' \
      || true
  )
done < <(find "$DOCS_DIR" -name '*.md' -print0 | sort -z)

echo "  Checked $CHECKED wikilinks."

if [ ${#BROKEN[@]} -gt 0 ]; then
  echo ""
  echo "  ERROR: Found ${#BROKEN[@]} broken wikilink(s):"
  for b in "${BROKEN[@]}"; do
    echo "    - $b"
  done
  echo ""
  echo "  Create the missing target files or fix the wikilink paths."
  exit 1
fi

echo "  No broken wikilinks found."
echo "=== Wikilink validation passed ==="
