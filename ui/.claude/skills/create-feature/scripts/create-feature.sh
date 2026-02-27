#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/create-feature.sh <feature-path>
# Example: bash scripts/create-feature.sh projects/repositories

FEATURE_PATH="${1:?Usage: create-feature.sh <feature-path>}"

# --- Derived names ---

# Namespace: projects/repositories → projects.repositories
NAMESPACE="${FEATURE_PATH//\//.}"

# PascalCase: projects/repositories → ProjectRepositories (correct for multi-segment)
to_pascal() {
  echo "$1" | sed 's/[_/-]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | tr -d ' '
}
PASCAL_NAME=$(to_pascal "$FEATURE_PATH")

# --- Project root detection ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$PROJECT_ROOT/src"

# --- 1. Route file ---
ROUTE_DIR="$SRC/routes/(app)/_layout/$(dirname "$FEATURE_PATH" 2>/dev/null || echo ".")"
ROUTE_FILE="$SRC/routes/(app)/_layout/${FEATURE_PATH}.tsx"

mkdir -p "$(dirname "$ROUTE_FILE")"
cat > "$ROUTE_FILE" << EOF
import { createFileRoute } from '@tanstack/react-router'
import { ${PASCAL_NAME}Page } from '@/features/${FEATURE_PATH}/pages/${PASCAL_NAME}Page'

export const Route = createFileRoute('/(app)/_layout/${FEATURE_PATH}')({
  component: ${PASCAL_NAME}Page,
})
EOF

echo "✓ Route:   $ROUTE_FILE"

# --- 2. Feature directory ---
FEATURE_DIR="$SRC/features/$FEATURE_PATH"
mkdir -p "$FEATURE_DIR"/{pages,components,hooks}

PAGE_FILE="$FEATURE_DIR/pages/${PASCAL_NAME}Page.tsx"
cat > "$PAGE_FILE" << EOF
import { Stack, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

export function ${PASCAL_NAME}Page() {
  const { t } = useTranslation()

  return (
    <Stack gap="md">
      <Title order={2}>{t('${NAMESPACE}.pageTitle')}</Title>
    </Stack>
  )
}
EOF

echo "✓ Page:    $PAGE_FILE"

# --- 3. Locale files ---
LOCALES_DIR="$SRC/locales"
HUMAN_NAME=$(echo "$PASCAL_NAME" | sed 's/\([A-Z]\)/ \1/g' | sed 's/^ //')

for LANG_DIR in "$LOCALES_DIR"/*/; do
  LANG=$(basename "$LANG_DIR")
  LOCALE_FILE="$LANG_DIR/${NAMESPACE}.json"
  cat > "$LOCALE_FILE" << EOF
{
  "pageTitle": "${HUMAN_NAME}"
}
EOF
  echo "✓ Locale:  $LOCALE_FILE"
done

echo ""
echo "Done! Next steps:"
echo "  1. pnpm typecheck  — verify route tree regenerates"
echo "  2. pnpm dev        — confirm route is accessible"
echo "  3. Implement the page and fill in locale strings"
