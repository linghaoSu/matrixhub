---
name: assemble-page
description: "Phase 3 of page development: merge all built components, assemble the page, write and pass E2E tests, update component registry. Run AFTER /build-components completes. Reads the master plan and all RESULTS.md from Phase 2."
disable-model-invocation: true
context: fork
---

# Assemble Page (Phase 3 of 3)

Invoke: `/assemble-page docs/work-plans/plan.md`

## Prerequisites

- `/plan-page` has been run (Phase 1)
- `/build-components` has been run and ALL components show ✅ (Phase 2)
- All component branches are merged to the feature branch
- `pnpm test:unit` passes on the feature branch

## Step 1: Verify Phase 2 completion

Read the master plan and verify every component:

```bash
# Check all component RESULTS.md or .agent-status/*.json
for component in $(list from plan.md); do
  status=$(cat .agent-status/${component}.json | jq -r '.status')
  if [ "$status" != "COMPLETE" ]; then
    echo "❌ ${component} is not complete. Run /build-components --only ${component} first."
    exit 1
  fi
done
```

If ANY component is not COMPLETE, **STOP** and report which ones need to be fixed.

## Step 2: Run all unit tests

```bash
pnpm test:unit
```

All tests from Phase 2 must still pass after merge. If any fail, it's a merge issue — fix before proceeding.

## Step 3: Write E2E tests (RED)

Create Playwright E2E tests for the page:

```typescript
// e2e/{feature-path}.spec.ts
import { test, expect } from '@playwright/test'

test.describe('{PageName}', () => {
  test.beforeEach(async ({ page }) => {
    // Mock ALL backend APIs using route.fulfill
    await page.route('**/api/{resource}', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [/* mock data */] }),
      })
    })
    await page.goto('/{route-path}')
  })

  test('Happy path: displays data correctly', async ({ page }) => {
    // Test main user journey
  })

  test('Interaction: filters work', async ({ page }) => {
    // Test key interactions
  })

  test('Empty state: shows when no data', async ({ page }) => {
    // Test edge case
  })

  test('Error state: shows error message', async ({ page }) => {
    // Test error handling
  })
})
```

Run and confirm RED:
```bash
pnpm test:e2e e2e/{feature-path}.spec.ts
```

## Step 4: Assemble the page

1. Create the route file in `src/routes/`:
   ```typescript
   import { createFileRoute } from '@tanstack/react-router'
   import { ProjectRepositoriesPage } from '@/features/projects/pages/ProjectRepositoriesPage'

   export const Route = createFileRoute('/{path}')({
     component: ProjectRepositoriesPage,
   })
   ```

2. Create the page component:
   ```typescript
   // src/features/projects/pages/ProjectRepositoriesPage.tsx
   import { useRepositories } from '../hooks/useRepositories'
   import { RepositoryTable } from '../components/RepositoryTable'
   import { RepositoryFilters } from '../components/RepositoryFilters'
   // ... import all components from Phase 2
   ```

3. Create the data hook:
   ```typescript
   // src/features/projects/hooks/useRepositories.ts
   import { apiClient } from '@/shared/api'
   // ...
   ```

4. Create locale entries.

**CRITICAL**: If a child component behaves incorrectly at the page level, do NOT fix it here. Create a new work plan for that component and run `/build-components --only {Component}` to fix it in isolation.

## Step 5: E2E GREEN

```bash
pnpm test:e2e e2e/{feature-path}.spec.ts
```

Fix assembly issues until E2E tests pass.

## Step 6: Full quality gate

```bash
pnpm lint        # zero errors, zero warnings
pnpm typecheck   # zero errors
pnpm test:unit   # all component tests still pass
pnpm test:e2e    # page E2E tests pass
```

ALL four must pass.

## Step 7: Update component registry

Open `docs/components-registry.md` and add entries for every new component:

```markdown
### RepositoryRow

- **Path**: `src/features/projects/components/RepositoryRow.tsx`
- **Props**: `RepositoryRowProps` — name, language, updatedAt, onDelete
- **Description**: Single row in the repository list table
- **Test**: `RepositoryRow.test.tsx`
- **Visual baseline**: `__baselines__/RepositoryRow.baseline.png`
```

## Step 8: Commit

```bash
git add -A
git commit -m "feat({page-name}): assemble page with E2E tests"
git push origin feat/{page-name}
```

## Step 9: Cleanup

```bash
# Remove work plans (they've served their purpose)
# Or keep them as documentation — team preference

# Remove agent status files
rm -rf .agent-status/

# Prune worktrees
git worktree prune
```

## Output summary

```
━━━ ASSEMBLE-PAGE COMPLETE ━━━
Branch: feat/project-repositories
Page: ProjectRepositoriesPage

Components used: 5 (2 existing + 3 new from Phase 2)
E2E tests: 4/4 passing
Unit tests: all passing
Lint: ✅  Typecheck: ✅

Registry updated: 3 new entries in docs/components-registry.md
Commit: {hash}

Ready for PR review.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
