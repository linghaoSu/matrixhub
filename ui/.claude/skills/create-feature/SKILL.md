---
name: create-feature
description: Scaffold a new feature with route, page, components, and locale files. Use when creating a new page, route, or feature module. Generates all required files following project conventions automatically.
disable-model-invocation: true
---

# Create Feature Scaffold

Scaffold a complete feature following project conventions. Invoke with `/create-feature <feature-path>`.

Example: `/create-feature projects/repositories`

## What gets created

Given a feature path like `projects/repositories`, create all of the following:

### 1. Route file

Path: `src/routes/(app)/_layout/{feature-path}.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { {PascalName}Page } from '@/features/{feature-path}/pages/{PascalName}Page'

export const Route = createFileRoute('/(app)/_layout/{feature-path}')({
  component: {PascalName}Page,
})
```

### 2. Feature directory

```
src/features/{feature-path}/
├── pages/
│   └── {PascalName}Page.tsx
├── components/        (empty, created for convenience)
└── hooks/             (empty, created for convenience)
```

Note: There is NO `api/` directory inside features. All API types, client interfaces, and mock implementations live in `src/shared/api/`. See `rules/api-layer.md`.

The page file:

```tsx
import { Stack, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'

export function {PascalName}Page() {
  const { t } = useTranslation()

  return (
    <Stack gap="md">
      <Title order={2}>{t('{namespace}.pageTitle')}</Title>
    </Stack>
  )
}
```

### 3. Locale files

For each supported language (check existing `src/locales/` subdirectories):

```
src/locales/{lang}/{namespace}.json
```

Where `{namespace}` is the dot-joined feature path (e.g., `projects.repositories`).

Content:

```json
{
  "pageTitle": "{Human-readable feature name}"
}
```

## Naming conventions

| Input | Example |
|---|---|
| Feature path | `projects/repositories` |
| PascalName | `ProjectRepositories` |
| Namespace | `projects.repositories` |
| Route path | `/(app)/_layout/projects/repositories` |

## After scaffolding

1. Run `pnpm typecheck` to verify the route tree regenerates correctly
2. Run `pnpm dev` to confirm the route is accessible
3. Fill in the page implementation, additional components, and locale strings

## Script

For automated scaffolding, run:

```bash
bash scripts/create-feature.sh {feature-path}
```

The script handles all file creation, naming conversion, and locale file generation.
