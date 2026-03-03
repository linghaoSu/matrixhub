# MatrixHub UI

<!-- 
  This file serves as the entry point for OpenCode and Codex.
  Claude Code reads CLAUDE.md directly. OpenCode reads AGENTS.md first (falls back to CLAUDE.md).
  Codex reads AGENTS.md with directory inheritance.
  
  Structure:
  - This file = CLAUDE.md content + rules inlined (since OpenCode/Codex don't read .claude/rules/)
  - Skills in .claude/skills/ are natively compatible with OpenCode
  - Agents are duplicated to .opencode/agents/ for OpenCode
  - Hooks are implemented via OpenCode plugins and a Makefile for Codex
-->

## Stack

- Mantine v8 (UI framework)
- TanStack Router (routing)
- TanStack Form (form management, NOT @mantine/form)
- react-i18next (internationalization)
- Playwright (E2E + visual regression)
- Vitest (unit tests)

## Directory structure

```
src/
├── routes/          # TanStack Router route definitions (adapters only)
├── features/        # Feature modules
│   └── {feature}/
│       ├── components/    # UI components (Atom/Molecule)
│       │   ├── __fixtures__/   # Visual test fixtures
│       │   └── __baselines__/  # Design reference PNGs + manifest
│       ├── hooks/         # Data hooks (useXxx)
│       └── pages/         # Page components (assembled in Phase 3)
├── shared/
│   ├── ui/          # Cross-feature reusable components
│   └── api/         # API abstraction layer
│       ├── types/   # Hand-written types (replaced by proto-gen later)
│       ├── client/  # ApiClient interface
│       └── mock/    # Mock implementation (dev only)
└── locales/         # i18n translation files
```

## Forbidden

- `@mantine/form` — use TanStack Form exclusively
- Hardcoded colors/spacing — use Mantine theme tokens
- `<div>` when a Mantine primitive exists (Stack, Group, Box, Flex)
- Raw CSS / inline styles — use Mantine sx or className with CSS Modules
- Literal UI strings — all text via `t()` from react-i18next
- Data fetching inside components — only in hooks, passed as props
- Importing from `@/shared/api/mock/*` in feature code — always through barrel `@/shared/api`
- Importing from `@/shared/api/types/*` directly — always through barrel
- Creating an `api/` directory inside features — API layer is shared only
- Skipping phases in the development workflow
- Self-rationalizing shortcuts: "由于时间有限", "让我快速完成", "先完成关键组件再...", "直接进行页面组装" are ALL violations
- Batch-skipping: "快速完成剩余组件" = skipping. Each component is an independent cycle.
- Proceeding to page assembly while ANY component lacks passing unit tests AND visual regression (≥ 99%)
- Skipping visual regression for any component
- Using random/placeholder data in visual test fixtures — must match design exactly

## Development workflow

For full page development, use the three-phase pipeline:
1. `/plan-page` — architecture, baselines, work plans (single session, commits)
2. `/build-components` — parallel sub-agents in worktrees build each component
3. `/assemble-page` — merge, wire up page, E2E tests (single session, commits)

For small changes, work directly with rules auto-enforced.

## Component development rules

### TDD (applies to all code changes)

Every new component follows Red → Green → Refactor:
1. Write test first → run → must FAIL (RED)
2. Implement minimum code → run → must PASS (GREEN)
3. Refactor while keeping tests green

Visual TDD is mandatory for UI components:
- Every component needs a `.visual.spec.ts` file
- Fixture data must exactly match the design reference
- Playwright screenshot compared against baseline at ≥ 99% similarity
- `maxDiffPixelRatio: 0.01` is the hard threshold

### Component-Driven Development

Layer hierarchy: Atom → Molecule → Page (no cycles)
- Atoms: single-purpose, stateless, Mantine-primitive based
- Molecules: compose atoms + optional local state
- Pages: route-level, receive data from hooks, pass to components

Every component must be in `docs/components-registry.md` (SSOT).
Before creating a new component, check if it exists in the registry.

### Mantine

- Always use Mantine primitives over raw HTML
- Use Mantine's `{prop}` API (e.g., `<Stack gap="md">`) not manual CSS
- Reference Mantine v8 docs when unsure — read `llms-full.txt`
- No custom wrappers around Mantine primitives unless adding business logic

### TanStack Router

- Route files are adapters: `createFileRoute()` → import page component
- Zero business logic in route files
- Data loading via hooks in page components, not route loaders

### TanStack Form

- TanStack Form is the exclusive form library (never `@mantine/form`, never `react-hook-form`)
- Field-level validation preferred over form-level for async scenarios

### react-i18next

- Zero literal strings in UI components
- Namespace per feature: `t('projects:repositoryList.title')`
- Always use `useTranslation()` hook, not `<Trans>` component

### API layer

- Features import ONLY from `@/shared/api` (barrel)
- Client is an interface — mock and proto both implement it
- When proto SDK arrives: generate types → create proto client → update barrel → zero feature changes

## Quality gate (run before every commit)

```bash
pnpm lint          # zero errors, zero warnings
pnpm typecheck     # zero errors
pnpm test:unit     # all tests pass
```

## For OpenCode users

OpenCode reads this file as project rules. Skills in `.claude/skills/` are auto-discovered.
Agents are in `.opencode/agents/` (duplicated from `.claude/agents/` with OpenCode frontmatter).
Hooks are implemented via `.opencode/plugins/quality-gate.ts` — install with `bun install` in `.opencode/`.

## For Codex users

Codex reads this file as project rules. Additionally:

**Skills**: Codex supports `.agents/skills/*/SKILL.md` natively. Copy or symlink from `.claude/skills/`:
```bash
ln -s .claude/skills .agents/skills
```
Or invoke explicitly: `$plan-page`, `$build-components`, `$assemble-page`.

**Multi-agent**: Codex supports multi-agent workflows via `[agents]` in `.codex/config.toml` (experimental). Configure `component-builder` as an agent role:
```toml
# .codex/config.toml
[features]
multi_agent = true

[agents]
max_threads = 4
max_depth = 1

[agents.component-builder]
description = "Builds a single component following a work plan. TDD + visual regression."
config_file = "agents/component-builder.toml"
```

**Worktree**: Codex app supports worktree threads natively. CLI worktree isolation works through multi-agent threads.

**Hooks**: Codex has `notify` (agent-turn-complete event only). For full quality gates, use `make gate` or configure pre-commit hooks externally.
