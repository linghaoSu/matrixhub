# MatrixHub UI

Console-focused SPA. Mantine v8 + TanStack Router + TanStack Form + react-i18next.

## Stack (immutable)

- pnpm
- Vite + React Compiler
- TypeScript (strict)
- Mantine v8 (sole component library)
- TanStack Router (file-based routing)
- TanStack Form (form state & validation)
- react-i18next (mandatory for all user-facing strings)
- ESLint v9 (flat config)
- Vitest (unit / component testing)
- Playwright (E2E + visual regression)

Rolldown is disabled — Mantine and Rolldown conflict (mantine/issues/8448). Do not re-enable.

## Commands

```
pnpm install
pnpm dev
pnpm build
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm test:unit     # Vitest
pnpm test:e2e      # Playwright
```

Fix all lint and typecheck failures before committing.

## Development philosophy (always enforced)

Three principles govern ALL code changes in this project:

1. **Test-Driven Development (TDD)** — Never write implementation without a failing test first. Red → Green → Refactor. No exceptions.
2. **Component-Driven Development (CDD)** — UI is Lego. Atoms → Molecules → Pages. Build bottom-up, test each layer independently.
3. **Single Source of Truth (SSOT)** — Before creating any new component, verify `docs/components-registry.md` for existing alternatives. Reuse first, extend second, create last.

For the full phased workflow, invoke the three-phase pipeline:
1. `/plan-page` — architecture, baselines, work plans (single session, commits)
2. `/build-components` — parallel sub-agents in worktrees build each component (multi-session)
3. `/assemble-page` — merge, wire up page, E2E tests (single session, commits)

## Directory structure

```
src/
├── routes/        Routing adapters only (createFileRoute, layout, params/loaders)
├── features/      Domain features (pages + business logic)
├── shared/        Cross-feature infrastructure (UI shell, generic hooks, i18n helpers, API layer)
└── locales/       Per-feature localization files (one file per feature per language)
```

Do not introduce additional architectural layers beyond these four.

### Responsibilities

- `src/routes/` — Routing DSL only. Mount feature pages. MUST NOT contain UI or business logic.
- `src/features/` — Real feature implementation: pages / components / hooks / utils. Each static route maps to exactly one feature. Features call API through `src/shared/api/` — NEVER import mock implementations directly.
- `src/shared/` — Infrastructure only. MUST NOT contain domain logic.
- `src/shared/api/` — API abstraction layer. See "API layer architecture" below.
- `src/locales/` — One JSON file per feature per language. Filename MUST equal feature name. Keys accessed with feature prefix: `t('{feature}.{key}')`.

### API layer architecture

Backend interfaces are NOT finalized. Proto definitions and generated TS SDK will arrive later. Until then:

```
src/shared/api/
├── types/                 # Hand-written request/response types (replaced by proto-gen later)
│   ├── project.ts         # export interface Project { ... }
│   └── repository.ts
├── client/                # Abstract API client interface
│   └── index.ts           # export interface ApiClient { getProject(id: string): Promise<Project> }
├── mock/                  # Mock implementation (NEVER imported by features)
│   └── index.ts           # export const mockClient: ApiClient = { ... }
└── index.ts               # Re-exports the active client. Features import ONLY from here.
```

**The rule**: Features import from `@/shared/api` — NEVER from `@/shared/api/mock/*` or `@/shared/api/types/*` directly. The barrel `index.ts` decides which implementation is active. When proto SDK arrives, only `src/shared/api/` internals change; feature code stays untouched.

### Generated artifacts (read-only)

- `src/routeTree.gen.ts` — owned by TanStack Router code generator. Never edit manually.
- Future: `src/shared/api/generated/` — will be owned by proto code generator. Never edit manually.

## Forbidden

- UI or business logic inside `src/routes/`
- Domain logic inside `src/shared/` (except `src/shared/api/` which owns the API abstraction)
- Hooks directory containing non-hook functions
- Utils using `use*` naming
- i18n keys without feature prefix
- New architectural layers beyond routes / features / shared / locales
- Edits to generated files (routeTree.gen.ts, future proto-gen output)
- Raw `<div>` when Mantine primitives exist
- Hardcoded colors, spacing, radius, or font sizes
- Inline CSS when Mantine provides an equivalent
- Tailwind or any parallel utility CSS system
- Literal JSX strings without i18n wrapping
- Guessing Mantine / TanStack component APIs — always verify against skill references
- Writing implementation code before a failing test exists
- Creating a new component that duplicates functionality in `docs/components-registry.md`
- Hardcoding business data in tests or components — keep components generic
- Overriding child component styles from a parent with CSS hacks — fix the child component instead
- Claiming visual accuracy without running visual regression tests
- Advancing a component to page assembly without ≥ 99% visual regression similarity
- Using random data or "Lorem ipsum" in visual test fixtures — mock data must match the design reference exactly
- Skipping phases in the development workflow (`/plan-page` → `/build-components` → `/assemble-page`)
- **Self-rationalizing shortcuts**: phrases like "由于时间有限", "让我快速完成", "先完成关键组件再...", "直接进行页面组装" are ALL violations. There is no time pressure — quality gates exist for a reason. Every component gets the full Phase 2 cycle (unit test + visual regression), no matter how many components remain.
- **Batch-skipping**: "快速完成剩余组件" = skipping. Each component is an independent Phase 2 cycle. There is no "batch mode".
- Proceeding to Phase 3 while ANY Phase 2 component lacks passing unit tests AND visual regression (≥ 99%)
- **Importing mock implementations directly from features** — always go through `@/shared/api`
- **Placing API types inside feature directories** — all API types live in `src/shared/api/types/`
- **Calling fetch/axios/ky directly from features** — always use the API client abstraction
- **Mixing mock data with production code** — mock implementations live exclusively in `src/shared/api/mock/`

## Hooks, skills & agents

Automated quality gates are configured in `.claude/settings.json`:
- **PostToolUse (Edit|Write)** — ESLint runs automatically on every file Claude edits. Lint errors are fed back to Claude immediately.
- **Stop** — Full `pnpm lint` + `pnpm typecheck` run when Claude finishes a response. If there are errors, Claude sees them and should fix before considering the task done.

Detailed API references and workflows live in `.claude/skills/`.
Subagents for specialized tasks live in `.claude/agents/`.
Coding discipline rules scoped to specific file patterns live in `.claude/rules/`.

CLAUDE.md is the source of truth for immutable constraints. Skills and rules extend it — never contradict it.
