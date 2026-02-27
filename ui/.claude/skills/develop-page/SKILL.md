---
name: develop-page
description: Full phased development workflow for building new pages or features. Enforces Phase 0 (context sync) → Phase 1 (architecture) → Phase 2 (component TDD) → Phase 3 (page E2E) → Phase 4 (registry update). Use when creating a new page, implementing a feature from a design, or building any non-trivial UI. Never skip phases.
disable-model-invocation: true
context: fork
---

# Page Development Workflow (Phase 0–4)

Invoke with `/develop-page <description or design reference>`.

This is a strict sequential workflow. **You MUST complete each phase before advancing.** If a later phase reveals a problem in an earlier phase, go back — never hack around it.

---

## Phase 0: Read-Before-Write (Context Sync)

**Goal**: Know what already exists before writing anything.

### Steps

1. Read `docs/components-registry.md` to build a mental index of all available components.
   - If the file doesn't exist, run `pnpm generate:registry` (if available) or scan `src/shared/ui/` and `src/features/**/components/` manually.
2. Read the relevant locale files in `src/locales/` to understand existing i18n namespaces.
3. Read the route tree (`src/routes/`) to understand existing navigation structure.

### Output

State clearly:
- "Available atoms: [list from registry]"
- "Available molecules in this feature: [list]"
- "Existing locale namespaces: [list]"

### Gate

Do NOT proceed until you have confirmed the component inventory. If you skip this, you risk recreating existing components.

---

## Phase 1: Architecture & Decomposition

**Goal**: Plan the component tree before writing any code.

### Steps

1. Analyze the requirement / design.
2. Produce a **Component Decomposition Tree** like this:

```
ProjectRepositoriesPage (Page — NEW)
├── PageHeader (Molecule — EXISTING: src/shared/ui/PageHeader)
│   ├── Title ← Mantine
│   └── Button ← Mantine
├── RepositoryFilters (Molecule — NEW)
│   ├── TextInput ← Mantine
│   └── Select ← Mantine
├── RepositoryTable (Molecule — NEW)
│   ├── Table ← Mantine
│   └── RepositoryRow (Atom — NEW)
│       ├── Badge ← Mantine
│       └── ActionIcon ← Mantine
└── EmptyState (Atom — EXISTING: src/shared/ui/EmptyState)
```

3. For each **NEW** node, define its TypeScript contract:

```typescript
// RepositoryRow
export interface RepositoryRowProps {
  name: string
  language: string
  updatedAt: string
  onDelete?: () => void
}
```

4. **Define API types and data flow** (critical for API layer discipline):

   a. Identify what API data this page needs. Define the types in `src/shared/api/types/`:
   ```typescript
   // src/shared/api/types/repository.ts
   export interface Repository {
     id: string
     name: string
     language: string
     updatedAt: string
   }
   ```

   b. Define the client interface methods in `src/shared/api/client/index.ts`:
   ```typescript
   listRepositories(projectId: string): Promise<Repository[]>
   ```

   c. Plan the mock implementation (will be written in Phase 2).

   d. Plan the data hook: `useRepositories(projectId)` → calls `apiClient.listRepositories()`

   e. Verify the data flow:
   ```
   apiClient (mock) → useRepositories hook → Page (props) → Components (props)
   ```
   No component directly touches `apiClient`. Only hooks do.

5. List which tests are needed for each new component.

### Output

Write this decomposition to a temporary file or present it clearly.

### Gate

Verify:
- [ ] Every reusable existing component is marked EXISTING (not recreated)
- [ ] Every NEW component has a Props interface
- [ ] No component fetches data internally — all data via props
- [ ] No Mantine components are being reinvented
- [ ] API types are defined in `src/shared/api/types/` (not inside features)
- [ ] Client interface methods are defined in `src/shared/api/client/`
- [ ] Data flow is: apiClient → hook → page → component (no shortcuts)

Proceed only after this plan is solid.

---

## Phase 2: Component Factory (Bottom-Up TDD)

**Goal**: Build and test each NEW component from the leaves up. But first, set up the API layer.

### 2-pre. API Layer Setup

Before building any UI components, set up the data layer:

1. **Write API types** in `src/shared/api/types/{resource}.ts` (from Phase 1 plan).

2. **Add methods** to the `ApiClient` interface in `src/shared/api/client/index.ts`.

3. **Write mock implementation** in `src/shared/api/mock/index.ts` — implement the new methods with realistic mock data.

4. **Verify barrel re-exports** — `src/shared/api/index.ts` must re-export the new types.

5. **Write the data hook** in `src/features/{feature}/hooks/use{Resource}.ts`:
   ```tsx
   import { apiClient } from '@/shared/api'
   // Hook that calls apiClient and manages loading/error state
   ```

6. **Test the hook** (Red → Green):
   ```tsx
   // Mock at module level
   vi.mock('@/shared/api', () => ({
     apiClient: { listRepositories: vi.fn().mockResolvedValue([...]) },
   }))
   ```

**CRITICAL**: At no point should any feature file import from `@/shared/api/mock/*` or `@/shared/api/types/*` directly. Always through the barrel.

Now proceed to UI components:

For EACH new component (starting with the deepest atoms, then molecules):

### 2a. Logic TDD

1. **Write the test file** (`{ComponentName}.test.tsx`):
   - Render test: does it mount without errors?
   - Props test: does each prop affect output correctly?
   - Interaction test: do callbacks fire on user actions?
   - Edge cases: empty strings, missing optional props, long text overflow

2. **Run and confirm RED**:
   ```bash
   pnpm test:unit src/features/{path}/{ComponentName}.test.tsx
   ```
   The test MUST fail (component doesn't exist yet). If it passes, the test is wrong.

3. **Implement the component**.

4. **Run and confirm GREEN**:
   ```bash
   pnpm test:unit src/features/{path}/{ComponentName}.test.tsx
   ```
   All tests must pass. If any fail, fix the implementation (not the tests, unless the test itself has a bug).

5. **Refactor** while keeping tests green.

### 2b. Visual Regression (MANDATORY)

This sub-phase is NOT optional. Every new component must pass pixel-level visual regression.

1. **Prepare the fixture file** (`__fixtures__/{ComponentName}.fixture.ts`):
   - Mock data MUST exactly match the design reference (same text, same counts, same states).
   - Do NOT use random data, "Lorem ipsum", or generic placeholders.
   - This fixture is the single source of truth for visual testing.

2. **Write the visual test** (`{ComponentName}.visual.spec.ts`):
   ```typescript
   import { test, expect } from '@playwright/test'
   import { projectCardFixture } from './__fixtures__/ProjectCard.fixture'

   test('{ComponentName} matches design reference', async ({ page }) => {
     // Mount component in isolation with fixture data
     // Take screenshot
     // Compare against baseline with 99% threshold
     await expect(page).toHaveScreenshot('{ComponentName}.png', {
       maxDiffPixelRatio: 0.01,  // ≤ 1% pixel difference = 99% match
     })
   })
   ```

3. **Delegate to the `visual-reviewer` agent**:
   - Provide: component file path, fixture file path, design reference screenshot
   - The agent mounts the component with fixture data, takes a screenshot, and compares

4. **Threshold: ≥ 99% pixel similarity** (maxDiffPixelRatio ≤ 0.01):
   - ≥ 99% → **PASS**
   - < 99% → **FAIL** — analyze the agent's diff report, fix CSS/Mantine props, re-run
   - The agent will provide specific feedback: which regions differ, what CSS properties to adjust

5. **Loop until PASS**. Do NOT proceed to the next component until this one hits 99%.

### Gate

- [ ] Every new component has a passing unit test file (`.test.tsx`)
- [ ] Every new component has a passing visual regression test (`.visual.spec.ts`)
- [ ] Every visual test uses a fixture with data matching the design reference exactly
- [ ] `pnpm test:unit` passes for all new components
- [ ] All visual regression tests report ≥ 99% similarity

**HARD STOP**: If any component fails visual regression, it CANNOT be used in Phase 3 page assembly. Fix the component first.

---

## Phase 3: Page Assembly & E2E

**Goal**: Wire everything together and verify the full user journey.

### 3a. E2E Test First

1. Write a Playwright test for the page:
   ```typescript
   // e2e/{feature-path}.spec.ts
   import { test, expect } from '@playwright/test'

   test.describe('Project Repositories Page', () => {
     test.beforeEach(async ({ page }) => {
       // Mock ALL backend APIs
       await page.route('**/api/projects/*/repositories', (route) => {
         route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({ items: [/* mock data */] }),
         })
       })
       await page.goto('/projects/123/repositories')
     })

     test('displays repository list', async ({ page }) => {
       await expect(page.getByRole('table')).toBeVisible()
       await expect(page.getByRole('row')).toHaveCount(/* expected */)
     })

     test('filters repositories by name', async ({ page }) => {
       await page.getByPlaceholder(/* ... */).fill('frontend')
       await expect(page.getByRole('row')).toHaveCount(/* filtered count */)
     })
   })
   ```

2. **Run and confirm RED**:
   ```bash
   pnpm test:e2e e2e/{feature-path}.spec.ts
   ```

### 3b. Assembly

1. Create the route file (see `tanstack-router` rule).
2. Create the page component, importing all tested components.
3. Write page-level hooks for data fetching and state management.
4. Wire up i18n (all strings via `t()`).

### 3c. E2E Green

```bash
pnpm test:e2e e2e/{feature-path}.spec.ts
```

Fix issues until all E2E tests pass.

**CRITICAL**: If an E2E failure is caused by a child component bug:
- Do NOT hack around it at the page level.
- Go BACK to Phase 2, fix the component and its unit test, then return here.

### Gate

Note: The PostToolUse hook in `.claude/settings.json` runs ESLint on every file edit automatically, and the Stop hook runs full lint + typecheck when you finish responding. But in the `/develop-page` workflow, explicitly verify these pass before advancing:

- [ ] All E2E tests pass
- [ ] All unit tests still pass (`pnpm test:unit`)
- [ ] `pnpm lint` passes (zero warnings, zero errors)
- [ ] `pnpm typecheck` passes (zero errors)

If the Stop hook reported lint/typecheck errors, fix them NOW — do not proceed to Phase 4.

---

## Phase 4: Registry Update

**Goal**: Document new components for future reuse.

### Steps

1. Open `docs/components-registry.md`.
2. For each NEW component created in Phase 2, append an entry:

```markdown
### {ComponentName}

- **Path**: `src/features/{feature}/components/{ComponentName}.tsx`
- **Props**: `{ComponentName}Props` — {brief description of key props}
- **Description**: {one sentence explaining what it does}
- **Test**: `{ComponentName}.test.tsx`
```

3. If any component was promoted to `src/shared/ui/`, note it in the "Shared Atoms" section.

### Gate

- [ ] `docs/components-registry.md` is updated
- [ ] Every new component has a registry entry

---

## Summary: The flow

```
/develop-page "Implement project repositories page from Figma design"
    │
    ▼
Phase 0 ─── Read registry, locales, routes
    │
    ▼
Phase 1 ─── Decompose into component tree, define contracts
    │
    ▼
Phase 2 ─── For each NEW component (bottom-up):
    │         test RED → implement → test GREEN → visual check
    │
    ▼
Phase 3 ─── E2E test RED → assemble page → E2E GREEN
    │
    ▼
Phase 4 ─── Update components-registry.md
```

Never skip. Never hack. Always test first.
