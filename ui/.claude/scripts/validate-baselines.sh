#!/usr/bin/env bash
# validate-baselines.sh
#
# Validates the integrity of baseline images and manifest.
# Run after /extract-design-baselines to catch corruption or export failures.
#
# Usage:
#   bash .claude/scripts/validate-baselines.sh src/features/projects/components/__baselines__
#
# Exit code 0 = all valid, non-zero = failures found.

set -euo pipefail

BASELINE_DIR="${1:?Usage: validate-baselines.sh <baselines-dir>}"

if [ ! -d "$BASELINE_DIR" ]; then
  echo "❌ Baseline directory does not exist: $BASELINE_DIR"
  exit 1
fi

MANIFEST="$BASELINE_DIR/manifest.ts"
if [ ! -f "$MANIFEST" ]; then
  echo "❌ Manifest file missing: $MANIFEST"
  exit 1
fi

ERRORS=0

# Detect ImageMagick
if command -v magick &>/dev/null; then
  IDENTIFY="magick identify"
elif command -v identify &>/dev/null; then
  IDENTIFY="identify"
else
  echo "⚠️  ImageMagick not installed — cannot validate image dimensions. Skipping dimension checks."
  IDENTIFY=""
fi

# Find all baseline PNGs
PNGS=$(find "$BASELINE_DIR" -name '*.baseline.png' -type f | sort)

if [ -z "$PNGS" ]; then
  echo "❌ No baseline PNG files found in $BASELINE_DIR"
  exit 1
fi

echo "Validating baselines in $BASELINE_DIR..."
echo ""

for PNG in $PNGS; do
  COMPONENT=$(basename "$PNG" .baseline.png)
  echo "── $COMPONENT ──"

  # Check 1: File is not empty
  SIZE=$(stat -c%s "$PNG" 2>/dev/null || stat -f%z "$PNG" 2>/dev/null)
  if [ "$SIZE" -lt 100 ]; then
    echo "  ❌ CORRUPT: File is suspiciously small ($SIZE bytes). Likely a failed export."
    ERRORS=$((ERRORS + 1))
    continue
  fi
  echo "  ✅ File size: ${SIZE} bytes"

  # Check 2: File is a valid PNG
  HEADER=$(xxd -l 4 -p "$PNG")
  if [ "$HEADER" != "89504e47" ]; then
    echo "  ❌ CORRUPT: File is not a valid PNG (header: $HEADER)."
    ERRORS=$((ERRORS + 1))
    continue
  fi
  echo "  ✅ Valid PNG header"

  # Check 3: Image dimensions (if ImageMagick available)
  if [ -n "$IDENTIFY" ]; then
    DIMS=$($IDENTIFY -format "%wx%h" "$PNG" 2>/dev/null || echo "FAIL")
    if [ "$DIMS" = "FAIL" ]; then
      echo "  ❌ CORRUPT: ImageMagick cannot read this file."
      ERRORS=$((ERRORS + 1))
      continue
    fi

    W=$(echo "$DIMS" | cut -d'x' -f1)
    H=$(echo "$DIMS" | cut -d'x' -f2)
    echo "  ✅ Dimensions: ${W}×${H}"

    # Check minimum size (a component smaller than 10x10 is suspicious)
    if [ "$W" -lt 10 ] || [ "$H" -lt 10 ]; then
      echo "  ⚠️  WARNING: Image is very small (${W}×${H}). Likely a bad crop or wrong node."
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # Check 4: Component is referenced in manifest
  if ! grep -q "$COMPONENT" "$MANIFEST"; then
    echo "  ❌ NOT IN MANIFEST: $COMPONENT.baseline.png exists but manifest has no entry for $COMPONENT"
    ERRORS=$((ERRORS + 1))
  else
    echo "  ✅ Referenced in manifest"
  fi

  echo ""
done

# Check 5: Manifest references that don't have PNG files
# Extract component names from manifest (simple grep for quoted keys)
MANIFEST_NAMES=$(grep -oP "^\s*\w+" "$MANIFEST" | grep -v 'export\|const\|baselines\|baseline\|viewport\|tolerance\|figmaNodeId\|width\|height' | tr -d ' ' || true)
for NAME in $MANIFEST_NAMES; do
  if [ ! -f "$BASELINE_DIR/$NAME.baseline.png" ]; then
    echo "❌ MANIFEST ORPHAN: manifest references '$NAME' but $NAME.baseline.png does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
  echo "🚨 VALIDATION FAILED: $ERRORS issue(s) found."
  echo "   Fix these before proceeding to Phase 2."
  exit 1
else
  echo "✅ All baselines valid."
  exit 0
fi
