# TanStack Router API Reference (Project-Relevant Subset)

## createFileRoute

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path/to/route')({
  // Component to render
  component: MyComponent,

  // Data loading (runs before component renders)
  loader: async ({ params, context, abortController }) => {
    return await fetchData(params.id)
  },

  // Guard / redirect (runs before loader)
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },

  // Loading state
  pendingComponent: () => <LoadingSpinner />,
  pendingMinMs: 200,
  pendingMs: 500,

  // Error state
  errorComponent: ({ error }) => <ErrorDisplay error={error} />,

  // Search params validation
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    filter: (search.filter as string) || '',
  }),

  // Head / meta
  head: () => ({
    meta: [{ title: 'Page Title' }],
  }),
})
```

## File-based routing conventions

| File pattern | URL | Notes |
|---|---|---|
| `routes/index.tsx` | `/` | Root index |
| `routes/about.tsx` | `/about` | Static route |
| `routes/posts/$id.tsx` | `/posts/:id` | Dynamic param |
| `routes/posts/index.tsx` | `/posts` | Posts index |
| `routes/(app)/dashboard.tsx` | `/dashboard` | Route group (no URL segment) |
| `routes/_layout.tsx` | N/A | Pathless layout |
| `routes/(app)/_layout.tsx` | N/A | Layout within group |

### Layout routes

Layout routes (`_layout.tsx`) wrap child routes without adding a URL segment:

```tsx
// src/routes/(app)/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/shared/ui/AppShell'

export const Route = createFileRoute('/(app)/_layout')({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
```

### Route groups

Parentheses create groups that don't affect the URL:

```
routes/
├── (app)/
│   ├── _layout.tsx        → layout for all app routes
│   └── dashboard.tsx      → /dashboard
├── (auth)/
│   ├── _layout.tsx        → layout for auth routes
│   └── login.tsx          → /login
```

## createRootRouteWithContext

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  auth: AuthState
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
```

## Search params

Type-safe search params with validation:

```tsx
// In route file
export const Route = createFileRoute('/posts')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    sort: (search.sort as 'asc' | 'desc') || 'desc',
  }),
})

// In component — useSearch returns typed object
import { useSearch } from '@tanstack/react-router'

function PostsList() {
  const { page, sort } = useSearch({ from: '/posts' })
}
```

## Navigation

```tsx
import { Link, useNavigate } from '@tanstack/react-router'

// Declarative
<Link to="/posts/$id" params={{ id: '123' }} search={{ tab: 'comments' }}>
  View Post
</Link>

// Imperative
const navigate = useNavigate()
navigate({ to: '/posts/$id', params: { id: '123' } })
```

## Accessing loader data

```tsx
import { useLoaderData } from '@tanstack/react-router'

function PostPage() {
  const data = useLoaderData({ from: '/posts/$id' })
}
```
