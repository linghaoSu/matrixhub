---
paths:
  - "src/routes/**/*"
---

# TanStack Router File-Based Routing Discipline

## Route files are adapters only

Route files in `src/routes/` MUST only contain:

- `createFileRoute` / `createRootRouteWithContext` calls
- Layout wrappers (importing from features or shared)
- Params / search params type definitions
- `loader` / `beforeLoad` functions
- `pendingComponent` / `errorComponent` assignments

Route files MUST NOT contain:

- UI component definitions (JSX beyond simple layout composition)
- Business logic
- API calls (other than inside `loader`)
- State management

## One route ↔ one feature

Each static route maps to exactly one feature under `src/features/`. The route file imports and mounts the feature page:

```tsx
// src/routes/(app)/_layout/projects/$id/repositories.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ProjectRepositoriesPage } from '@/features/projects/repositories/pages/ProjectRepositoriesPage'

export const Route = createFileRoute('/(app)/_layout/projects/$id/repositories')({
  component: ProjectRepositoriesPage,
})
```

## Generated files

`src/routeTree.gen.ts` is owned by the TanStack Router code generator. Never edit it.

## Naming conventions

- Route folders mirror URL segments: `projects/$id/repositories` → `/projects/:id/repositories`
- Layout groups use parentheses: `(app)/`
- Layout files use underscore prefix: `_layout.tsx`

## When unsure about Router API

Consult the `tanstack-router-api` skill for createFileRoute options, search params, loader patterns, and layout route conventions.
