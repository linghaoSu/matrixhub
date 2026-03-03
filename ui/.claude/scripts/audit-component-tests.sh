#!/usr/bin/env bash
# audit-component-tests.sh
#
# PURPOSE: Project-wide file inventory scan (NOT test execution).
# Scans all component files in src/ and reports which ones are missing
# required companion files (test, fixture, baseline).
# Does NOT run any tests, does NOT evaluate pixel similarity.
#
# Called by: Stop hook after every Claude response.
# Output: Summary of components with missing files (fed back to Claude as context).

set -euo pipefail

VIOLATIONS=()

# Find all component tsx files (not pages, not tests, not routes)
find_components() {
  find src/features/*/components src/shared/ui -name '*.tsx' 2>/dev/null \
    | grep -v '\.test\.tsx$' \
    | grep -v '\.visual\.spec\.ts$' \
    | grep -v '\.spec\.ts$' \
    | grep -v '\.stories\.tsx$' \
    | grep -v '__fixtures__' \
    | sort
}

for COMPONENT in $(find_components); do
  BASENAME=$(basename "$COMPONENT" .tsx)
  DIR=$(dirname "$COMPONENT")

  UNIT_TEST="$DIR/$BASENAME.test.tsx"
  VISUAL_TEST="$DIR/$BASENAME.visual.spec.ts"
  FIXTURE_FILE="$DIR/__fixtures__/$BASENAME.fixture.ts"
  BASELINE_FILE="$DIR/__baselines__/$BASENAME.baseline.png"

  MISSING_PARTS=""
  [ ! -f "$UNIT_TEST" ] && MISSING_PARTS+="unit-test-file "
  [ ! -f "$VISUAL_TEST" ] && MISSING_PARTS+="visual-test-file "
  [ ! -f "$FIXTURE_FILE" ] && MISSING_PARTS+="fixture-file "
  [ ! -f "$BASELINE_FILE" ] && MISSING_PARTS+="baseline-png "

  # Check baseline file integrity (NOT pixel comparison)
  if [ -f "$BASELINE_FILE" ]; then
    BL_SIZE=$(stat -c%s "$BASELINE_FILE" 2>/dev/null || stat -f%z "$BASELINE_FILE" 2>/dev/null || echo "0")
    BL_HEADER=$(xxd -l 4 -p "$BASELINE_FILE" 2>/dev/null || echo "unknown")
    if [ "$BL_SIZE" -lt 100 ] || [ "$BL_HEADER" != "89504e47" ]; then
      MISSING_PARTS+="baseline-CORRUPT "
    fi
  fi

  if [ -n "$MISSING_PARTS" ]; then
    VIOLATIONS+=("$COMPONENT → missing: $MISSING_PARTS")
  fi
done

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo ""
  echo "🚨 FILE INVENTORY: ${#VIOLATIONS[@]} component(s) have missing companion files"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "This is a FILE EXISTENCE check — it does NOT run tests or pixel comparison."
  echo ""
  for v in "${VIOLATIONS[@]}"; do
    echo "  ❌ $v"
  done
  echo ""
  echo "Required files per component: .test.tsx + .visual.spec.ts + __fixtures__/*.fixture.ts + __baselines__/*.baseline.png"
  echo ""
  echo "After creating missing files, run the actual tests:"
  echo "  pnpm test:unit              — all unit tests"
  echo "  pnpm exec playwright test   — all visual comparison tests (pixel match ≥ 99%)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "✅ File inventory: all components have complete companion files."
fi
