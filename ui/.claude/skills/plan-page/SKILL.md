---
name: plan-page
description: "Phase 1 of page development: architecture decomposition, design baseline extraction, and sub-agent work plan generation. Reads component registry, decomposes the page into a component tree, extracts per-component baselines from Figma/screenshots, generates a work plan for each component (including test strategy and implementation guidance), and commits everything to a feature branch. Run this FIRST before /build-components."
disable-model-invocation: true
context: fork
---

# Plan Page (Phase 1 of 3)

Invoke: `/plan-page <description or Figma URL>`

This is the **orchestration planning phase**. It produces everything that parallel sub-agents need to independently build and test each component.

## What this skill does

1. Read-Before-Write (context sync)
2. Decompose the page into a component tree
3. Define TypeScript contracts for each new component
4. Plan API types and data flow
5. Extract design baselines (delegate to `/extract-design-baselines`)
6. Generate a **work plan** for each new component
7. Commit to a feature branch

## What this skill does NOT do

- Write any implementation code
- Write any tests
- Run any tests

---

## Step 1: Context sync (Phase 0)

1. Read `docs/components-registry.md` — index all existing components.
2. Read `src/locales/` — list existing i18n namespaces.
3. Read `src/routes/` — understand current route structure.
4. Read `src/shared/api/client/index.ts` — list existing API methods.

## Step 2: Decompose

Produce the component tree:

```
ProjectRepositoriesPage (Page — NEW)
├── PageHeader (Molecule — EXISTING: src/shared/ui/PageHeader)
├── RepositoryFilters (Molecule — NEW)
├── RepositoryTable (Molecule — NEW)
│   └── RepositoryRow (Atom — NEW)
└── EmptyState (Atom — EXISTING: src/shared/ui/EmptyState)
```

## Step 3: Define contracts

For each NEW component:

```typescript
// src/features/projects/components/RepositoryRow.tsx (contract only)
export interface RepositoryRowProps {
  name: string
  language: string
  updatedAt: string
  onDelete?: () => void
}
```

## Step 4: Plan API layer

- Define types in `src/shared/api/types/`
- Add methods to `ApiClient` interface
- Plan mock implementation
- Plan data hooks

## Step 5: Extract baselines

Delegate to `/extract-design-baselines`:

```
/extract-design-baselines <Figma URL or image path>
```

This produces `__baselines__/` with validated PNGs and manifest.

## Step 6: Generate work plans

This is the critical output. For EACH new component, generate a **self-contained work plan** file:

```
docs/work-plans/
├── plan.md                           # Master plan (overview + merge order)
├── RepositoryFilters.plan.md         # Work plan for RepositoryFilters
├── RepositoryTable.plan.md           # Work plan for RepositoryTable
└── RepositoryRow.plan.md             # Work plan for RepositoryRow
```

### Master plan (`docs/work-plans/plan.md`)

```markdown
# Page: Project Repositories

## Components to build (in parallel)

| Component | Layer | Dependencies | Assignee |
|---|---|---|---|
| RepositoryRow | Atom | none | agent-1 |
| RepositoryFilters | Molecule | none | agent-2 |
| RepositoryTable | Molecule | RepositoryRow | agent-3 (after agent-1 merges) |

## Dependency graph

RepositoryRow and RepositoryFilters can be built in parallel.
RepositoryTable depends on RepositoryRow — it must wait for agent-1 to merge.

## API types to create (shared, done in plan-page)

- `src/shared/api/types/repository.ts` — Repository, ListRepositoriesResponse
- `src/shared/api/client/index.ts` — listRepositories() method added

## After all components merge → /assemble-page
```

### Per-component work plan (`RepositoryRow.plan.md`)

Each work plan is a complete, self-contained brief that a sub-agent can follow without asking questions:

```markdown
# Component: RepositoryRow

## Contract

\```typescript
export interface RepositoryRowProps {
  name: string
  language: string
  updatedAt: string
  onDelete?: () => void
}
\```

## Files to create

1. `src/features/projects/components/RepositoryRow.tsx`
2. `src/features/projects/components/RepositoryRow.test.tsx`
3. `src/features/projects/components/RepositoryRow.visual.spec.ts`
4. `src/features/projects/components/__fixtures__/RepositoryRow.fixture.ts`

## Fixture data (must match design exactly)

\```typescript
export const repositoryRowFixture: RepositoryRowProps = {
  name: 'frontend-app',
  language: 'TypeScript',
  updatedAt: '2025-01-15T10:30:00Z',
  onDelete: () => {},
}
\```

## Baseline

- Image: `__baselines__/RepositoryRow.baseline.png` (1440×64)
- Viewport: `{ width: 1440, height: 64 }`
- Tolerance: 0.01 (99% match required)

## Design context (from Figma)

- Layout: horizontal flex, gap 16px (Mantine `gap="md"`)
- Name: Text, size sm, weight 500
- Language: Badge, variant light
- Date: Text, size xs, color dimmed
- Delete: ActionIcon, variant subtle, color red

## Figma extracted values (for visual convergence)

If design-context.json is available, include the precise values:
- Container: `{ w: 1440, h: 64, p: 16, gap: 12, radius: 0, border: '1px solid #e9ecef' }`
- Name text: `{ family: 'Inter', size: 14, weight: 500, lineHeight: 20, color: '#212529' }`
- Date text: `{ family: 'Inter', size: 12, weight: 400, lineHeight: 16, color: '#868e96' }`

These values are the starting point. The `component-builder` agent should apply them
directly as Mantine props. If visual test still fails after applying these values,
the agent should load `/figma-visual-convergence` for systematic diff triage.

## Unit test requirements

- Renders name, language badge, and formatted date
- Shows delete button only when onDelete is provided
- Fires onDelete callback on click
- Handles missing optional props gracefully

## Visual test requirements

- Mount with fixture data at viewport 1440×64
- Compare against __baselines__/RepositoryRow.baseline.png
- maxDiffPixelRatio: 0.01

## Rules to follow

- All strings via i18n `t()`
- Mantine primitives only (no raw div)
- No hardcoded colors/spacing
- No data fetching inside the component

## On completion

1. Run `pnpm test:unit RepositoryRow.test.tsx` — must pass
2. Run `pnpm exec playwright test RepositoryRow.visual.spec.ts` — must achieve ≥ 99%
3. Run `pnpm lint` and `pnpm typecheck` — must pass
4. Commit: `git add -A && git commit -m "feat(projects): implement RepositoryRow component"`
5. Write completion status to `RESULTS.md` in your worktree root
```

## Step 7: Create shared artifacts

Before committing, create the shared files that all sub-agents will need:

1. API types: `src/shared/api/types/{resource}.ts`
2. Client interface additions: `src/shared/api/client/index.ts`
3. Mock implementation: `src/shared/api/mock/index.ts`
4. Baseline images + manifest (from Step 5)
5. Locale skeleton files (empty keys, structure only)

## Step 8: Commit and push

```bash
git checkout -b feat/{page-name}
git add -A
git commit -m "plan({page-name}): architecture, baselines, and work plans"
git push -u origin feat/{page-name}
```

## Output summary

```
━━━ PLAN-PAGE COMPLETE ━━━
Branch: feat/project-repositories
Components planned: 3 (RepositoryRow, RepositoryFilters, RepositoryTable)
Parallel groups:
  Group 1 (parallel): RepositoryRow, RepositoryFilters
  Group 2 (after Group 1): RepositoryTable
Work plans: docs/work-plans/{Component}.plan.md
Baselines: src/features/projects/components/__baselines__/ (validated ✅)
API types: src/shared/api/types/repository.ts (committed)

Next step: /build-components docs/work-plans/plan.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
