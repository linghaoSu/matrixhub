#!/usr/bin/env bash
# check-component-pair.sh
#
# PURPOSE: File inventory check (NOT test execution).
# Verifies that a component's required companion files EXIST and are structurally valid.
# Does NOT run any tests, does NOT do pixel comparison, does NOT evaluate similarity.
#
# Called by: PostToolUse hook after every Write/Edit.
# Input: JSON from Claude Code on stdin with .tool_input.file_path
# Output: Warning text if files are missing (fed back to Claude as context).

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Exit silently if no file path or not a tsx file
[ -z "$FILE_PATH" ] && exit 0
[[ "$FILE_PATH" != *.tsx ]] && exit 0

# Only check component files (not pages, not tests, not route files)
case "$FILE_PATH" in
  src/features/*/components/*.tsx | src/features/*/components/**/*.tsx | src/shared/ui/*.tsx | src/shared/ui/**/*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Skip test files themselves
case "$FILE_PATH" in
  *.test.tsx | *.visual.spec.ts | *.spec.ts | *.stories.tsx)
    exit 0
    ;;
esac

# Derive expected companion file paths
BASENAME=$(basename "$FILE_PATH" .tsx)
DIR=$(dirname "$FILE_PATH")

UNIT_TEST="$DIR/$BASENAME.test.tsx"
VISUAL_TEST="$DIR/$BASENAME.visual.spec.ts"
FIXTURE_DIR="$DIR/__fixtures__"
FIXTURE_FILE="$FIXTURE_DIR/$BASENAME.fixture.ts"
BASELINE_DIR="$DIR/__baselines__"
BASELINE_FILE="$BASELINE_DIR/$BASENAME.baseline.png"
MANIFEST_FILE="$BASELINE_DIR/manifest.ts"

MISSING=()

[ ! -f "$UNIT_TEST" ] && MISSING+=("unit test file: $UNIT_TEST")
[ ! -f "$VISUAL_TEST" ] && MISSING+=("visual test file: $VISUAL_TEST")
[ ! -f "$FIXTURE_FILE" ] && MISSING+=("fixture file: $FIXTURE_FILE")
[ ! -f "$BASELINE_FILE" ] && MISSING+=("baseline PNG: $BASELINE_FILE (run /extract-design-baselines)")
[ ! -f "$MANIFEST_FILE" ] && MISSING+=("baseline manifest: $MANIFEST_FILE")

# If baseline PNG exists, verify file integrity (NOT pixel comparison).
if [ -f "$BASELINE_FILE" ]; then
  BL_SIZE=$(stat -c%s "$BASELINE_FILE" 2>/dev/null || stat -f%z "$BASELINE_FILE" 2>/dev/null || echo "0")
  if [ "$BL_SIZE" -lt 100 ]; then
    MISSING+=("baseline CORRUPT: $BASELINE_FILE is only ${BL_SIZE} bytes — re-export via /extract-design-baselines")
  else
    BL_HEADER=$(xxd -l 4 -p "$BASELINE_FILE" 2>/dev/null || echo "unknown")
    if [ "$BL_HEADER" != "89504e47" ]; then
      MISSING+=("baseline CORRUPT: $BASELINE_FILE is not a valid PNG (header: ${BL_HEADER}) — re-export")
    fi
  fi
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  MISSING FILES for component: $FILE_PATH"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "This is a FILE INVENTORY check — it does NOT run tests or pixel comparison."
  echo ""
  for item in "${MISSING[@]}"; do
    echo "  ❌ $item"
  done
  echo ""
  echo "Required companion files per component:"
  echo "  1. {Name}.test.tsx              — unit test source file"
  echo "  2. {Name}.visual.spec.ts        — Playwright visual test source file"
  echo "  3. __fixtures__/{Name}.fixture.ts    — mock data file"
  echo "  4. __baselines__/{Name}.baseline.png — design reference image"
  echo "  5. __baselines__/manifest.ts         — viewport + tolerance config"
  echo ""
  echo "Create the missing files, then run the actual tests separately:"
  echo "  pnpm test:unit {Name}.test.tsx                    — logic tests"
  echo "  pnpm exec playwright test {Name}.visual.spec.ts   — pixel comparison (≥ 99%)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
