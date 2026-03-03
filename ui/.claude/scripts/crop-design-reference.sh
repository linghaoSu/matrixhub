#!/usr/bin/env bash
# crop-design-reference.sh
#
# Crops a component region from a full-page design reference image.
# Used in Phase 1 step 6 to produce baseline images for visual regression.
#
# Requires: ImageMagick (convert/magick command)
#
# Usage:
#   bash .claude/scripts/crop-design-reference.sh \
#     --source designs/project-repositories.png \
#     --component RepositoryRow \
#     --region "100,200,800,64" \
#     --output src/features/projects/components/__baselines__/RepositoryRow.baseline.png
#
# The --region parameter is "x,y,width,height" in pixels from the top-left corner.

set -euo pipefail

# Parse arguments
SOURCE=""
COMPONENT=""
REGION=""
OUTPUT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --source)   SOURCE="$2"; shift 2 ;;
    --component) COMPONENT="$2"; shift 2 ;;
    --region)   REGION="$2"; shift 2 ;;
    --output)   OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Validate inputs
if [ -z "$SOURCE" ] || [ -z "$COMPONENT" ] || [ -z "$REGION" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: crop-design-reference.sh --source <image> --component <name> --region <x,y,w,h> --output <path>" >&2
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: Source image not found: $SOURCE" >&2
  exit 1
fi

# Parse region
IFS=',' read -r X Y W H <<< "$REGION"

if [ -z "$X" ] || [ -z "$Y" ] || [ -z "$W" ] || [ -z "$H" ]; then
  echo "ERROR: Invalid region format. Expected: x,y,width,height (e.g., 100,200,800,64)" >&2
  exit 1
fi

# Create output directory
mkdir -p "$(dirname "$OUTPUT")"

# Detect ImageMagick version and use appropriate command
if command -v magick &>/dev/null; then
  CONVERT_CMD="magick"
elif command -v convert &>/dev/null; then
  CONVERT_CMD="convert"
else
  echo "ERROR: ImageMagick is required but not installed." >&2
  echo "Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)" >&2
  exit 1
fi

# Crop the image
# ImageMagick crop syntax: WxH+X+Y
$CONVERT_CMD "$SOURCE" -crop "${W}x${H}+${X}+${Y}" +repage "$OUTPUT"

# Verify output
if [ ! -f "$OUTPUT" ]; then
  echo "ERROR: Crop failed — output file not created." >&2
  exit 1
fi

# Report dimensions of output image
OUTPUT_DIMS=$($CONVERT_CMD "$OUTPUT" -format "%wx%h" info:)

echo "✅ Cropped baseline for $COMPONENT"
echo "   Source: $SOURCE"
echo "   Region: x=$X y=$Y w=$W h=$H"
echo "   Output: $OUTPUT ($OUTPUT_DIMS)"
echo ""
echo "   Add to __baselines__/manifest.ts:"
echo "   $COMPONENT: {"
echo "     baseline: './$COMPONENT.baseline.png',"
echo "     viewport: { width: $W, height: $H },"
echo "     tolerance: 0.01,"
echo "   }"
