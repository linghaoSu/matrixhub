---
paths:
  - "src/features/**/*"
  - "src/shared/api/**/*"
---

# API Layer Discipline

## Context

Backend interfaces are NOT finalized. Proto definitions and a generated TS SDK will arrive later. Until then, the frontend uses **hand-written types + mock implementations**. The architecture MUST ensure that when proto SDK lands, **zero feature code changes** — only `src/shared/api/` internals get replaced.

## Architecture

```
src/shared/api/
├── types/                 # Request/response types (hand-written now, proto-gen later)
│   ├── project.ts
│   └── repository.ts
├── client/                # Abstract client interface
│   └── index.ts
├── mock/                  # Mock implementation (dev only)
│   └── index.ts
└── index.ts               # Barrel — the ONLY thing features import
```

## The 3 rules

### Rule 1: Features import ONLY from `@/shared/api`

```tsx
// ✅ Correct
import { apiClient } from '@/shared/api'
import type { Project } from '@/shared/api'

const projects = await apiClient.listProjects()
```

```tsx
// ❌ FORBIDDEN — importing mock directly
import { mockClient } from '@/shared/api/mock'

// ❌ FORBIDDEN — importing types from internal path
import type { Project } from '@/shared/api/types/project'

// ❌ FORBIDDEN — raw fetch in feature code
const res = await fetch('/api/projects')
```

### Rule 2: The client is an interface, not an implementation

```typescript
// src/shared/api/client/index.ts

export interface ApiClient {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project>
  createProject(data: CreateProjectRequest): Promise<Project>
  deleteProject(id: string): Promise<void>
  // ... one method per API endpoint
}
```

Every API method is defined here as an interface. Mock and future proto-gen SDK both implement this same interface.

### Rule 3: The barrel decides which implementation is active

```typescript
// src/shared/api/index.ts

// Re-export types (features need these)
export type { Project, Repository, CreateProjectRequest } from './types/project'
export type { ApiClient } from './client'

// Re-export the active client implementation
// TODAY: mock
export { mockClient as apiClient } from './mock'

// FUTURE (when proto SDK arrives):
// export { protoClient as apiClient } from './generated'
```

When proto SDK lands, this file changes ONE import line. Nothing else in the codebase changes.

## Writing types

Types should mirror what the eventual proto will produce. Keep them simple and data-oriented:

```typescript
// src/shared/api/types/project.ts

export interface Project {
  id: string
  name: string
  description: string
  createdAt: string   // ISO 8601
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description: string
}

export interface ListProjectsResponse {
  items: Project[]
  total: number
  nextPageToken?: string
}
```

Conventions:
- Use `string` for IDs (proto typically generates string IDs)
- Use ISO 8601 `string` for timestamps (not `Date` — proto generates strings)
- Use `{Resource}Request` / `{Resource}Response` naming for request/response wrappers
- Pagination uses `nextPageToken` pattern (common in proto APIs)

## Writing mock implementations

```typescript
// src/shared/api/mock/index.ts
import type { ApiClient } from '../client'
import type { Project } from '../types/project'

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Frontend', description: 'UI repo', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: '2', name: 'Backend', description: 'API repo', createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' },
]

export const mockClient: ApiClient = {
  async listProjects() {
    return MOCK_PROJECTS
  },
  async getProject(id) {
    const p = MOCK_PROJECTS.find((p) => p.id === id)
    if (!p) throw new Error(`Project ${id} not found`)
    return p
  },
  // ...
}
```

Mock data lives ONLY inside `src/shared/api/mock/`. It MUST NOT leak into features, components, or tests outside this directory.

## Using the API in features

The standard pattern for features using API data:

```tsx
// src/features/projects/hooks/useProjects.ts
import { apiClient } from '@/shared/api'
import type { Project } from '@/shared/api'

export function useProjects() {
  // Use with TanStack Query, SWR, or simple useState + useEffect
  // The point: apiClient is the only way to get data
}
```

```tsx
// src/features/projects/pages/ProjectsPage.tsx
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from '../components/ProjectCard'

export function ProjectsPage() {
  const { data: projects } = useProjects()
  return (
    <Stack gap="md">
      {projects?.map((p) => (
        <ProjectCard key={p.id} title={p.name} description={p.description} />
      ))}
    </Stack>
  )
}
```

Note: `ProjectCard` receives plain props — it knows nothing about `apiClient` or `Project` types. Data fetching stays in hooks, display stays in components.

## Testing with the API layer

### Unit tests (components)

Components receive data via props. They don't need the API layer at all:

```tsx
// ProjectCard.test.tsx — no API mocking needed
render(<ProjectCard title="Frontend" description="UI repo" />)
```

### Unit tests (hooks)

Mock the API client at the module level:

```tsx
// useProjects.test.ts
vi.mock('@/shared/api', () => ({
  apiClient: {
    listProjects: vi.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
  },
}))
```

### E2E tests (Playwright)

Mock at the network level — this is already correct because E2E should not know about the API abstraction layer:

```typescript
await page.route('**/api/projects', (route) => {
  route.fulfill({ status: 200, body: JSON.stringify({ items: [...] }) })
})
```

## When proto SDK arrives (future migration guide)

1. Run proto code generator → outputs to `src/shared/api/generated/`
2. Verify generated types match the hand-written types in `src/shared/api/types/` (or replace them)
3. Create a new client implementation in `src/shared/api/generated/` that implements `ApiClient`
4. Update `src/shared/api/index.ts` barrel to export the proto client instead of mock
5. Run `pnpm typecheck` — if all features used the barrel correctly, zero errors
6. Delete `src/shared/api/mock/` and `src/shared/api/types/` (replaced by generated code)
