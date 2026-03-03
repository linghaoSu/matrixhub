#!/usr/bin/env bash
# enforce-visual-threshold.sh
#
# PURPOSE: Policy gate — ensures no visual test or manifest has a threshold > 0.01.
# Catches attempts to "relax threshold to pass" which is a forbidden shortcut.
#
# This script checks SOURCE FILES for hardcoded threshold values.
# It does NOT run any tests or do pixel comparison.
#
# Usage:
#   bash .claude/scripts/enforce-visual-threshold.sh
#
# Exit code 0 = all thresholds compliant, non-zero = violations found.

set -euo pipefail

VIOLATIONS=0

echo "Scanning visual test files for threshold compliance..."
echo ""

# Check .visual.spec.ts files for maxDiffPixelRatio > 0.01
while IFS= read -r FILE; do
  # Extract maxDiffPixelRatio values
  while IFS= read -r LINE; do
    # Get the numeric value after maxDiffPixelRatio:
    VALUE=$(echo "$LINE" | grep -oP 'maxDiffPixelRatio\s*:\s*\K[0-9.]+' || true)
    if [ -n "$VALUE" ]; then
      # Compare: anything > 0.01 is a violation
      IS_VIOLATION=$(echo "$VALUE > 0.01" | bc -l 2>/dev/null || echo "0")
      if [ "$IS_VIOLATION" = "1" ]; then
        LINENUM=$(grep -n "maxDiffPixelRatio" "$FILE" | head -1 | cut -d: -f1)
        echo "  ❌ $FILE:$LINENUM — maxDiffPixelRatio: $VALUE (must be ≤ 0.01)"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    fi
  done < <(grep -n "maxDiffPixelRatio" "$FILE" 2>/dev/null || true)
done < <(find src -name '*.visual.spec.ts' -type f 2>/dev/null)

# Check manifest.ts files for tolerance > 0.01
while IFS= read -r FILE; do
  while IFS= read -r LINE; do
    VALUE=$(echo "$LINE" | grep -oP 'tolerance\s*:\s*\K[0-9.]+' || true)
    if [ -n "$VALUE" ]; then
      IS_VIOLATION=$(echo "$VALUE > 0.01" | bc -l 2>/dev/null || echo "0")
      if [ "$IS_VIOLATION" = "1" ]; then
        LINENUM=$(grep -n "tolerance" "$FILE" | head -1 | cut -d: -f1)
        echo "  ❌ $FILE:$LINENUM — tolerance: $VALUE (must be ≤ 0.01)"
        VIOLATIONS=$((VIOLATIONS + 1))
      fi
    fi
  done < <(grep -n "tolerance" "$FILE" 2>/dev/null || true)
done < <(find src -name 'manifest.ts' -path '*__baselines__*' -type f 2>/dev/null)

echo ""
if [ "$VIOLATIONS" -gt 0 ]; then
  echo "🚨 THRESHOLD VIOLATION: $VIOLATIONS file(s) have relaxed visual thresholds."
  echo "   The threshold maxDiffPixelRatio: 0.01 (tolerance: 0.01) is a hard gate."
  echo "   Do NOT increase the threshold to make tests pass."
  echo "   Instead, use /figma-visual-convergence to systematically reduce the actual visual diff."
  exit 1
else
  echo "✅ All visual thresholds compliant (≤ 0.01)."
  exit 0
fi
