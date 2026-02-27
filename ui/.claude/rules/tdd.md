---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "**/*.test.tsx"
  - "**/*.test.ts"
  - "**/*.spec.tsx"
  - "**/*.spec.ts"
---

# Test-Driven Development Discipline

## The law: Red → Green → Refactor

Every implementation change MUST follow this cycle:

1. **Red** — Write or update a test that describes the expected behavior. Run `pnpm test:unit <file>` and confirm it FAILS.
2. **Green** — Write the minimum implementation to make the test pass. Run the test again and confirm it PASSES.
3. **Refactor** — Clean up the code while keeping tests green.

## What counts as a "failing test first"

- New component → write test file with `describe('{ComponentName}', ...)` covering render, props, user interactions, and edge cases BEFORE writing the component.
- New hook → write test covering return values, state transitions, and error cases BEFORE implementing.
- New utility function → write test covering happy path and boundary conditions BEFORE implementing.
- Bug fix → write a test that reproduces the bug (must fail on current code) BEFORE fixing.

## Test file conventions

- Unit tests live alongside the code: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Use `@testing-library/react` for component tests
- Use `vitest` for assertions and mocking
- Mock all external dependencies (API calls, router, i18n)

## What NOT to test via unit tests

- Mantine component internals (trust the library)
- Router navigation (covered by E2E)
- Pixel-level visual accuracy (covered by visual regression — see below)

## Visual TDD: mandatory for every component

Unit tests verify **logic**. Visual regression tests verify **appearance**. Both are required.

Every component MUST pass visual regression with ≥ 99% pixel similarity before it can be used in page assembly. This is not optional — it has the same priority as unit tests.

### The cycle

1. Prepare mock data that **exactly matches the design reference** (same text, same counts, same states). See `rules/component-driven.md` for mock data requirements.
2. Mount the component with mock data in an isolated viewport.
3. Take a screenshot with Playwright.
4. Compare against the design reference screenshot.
5. Similarity ≥ 99% → PASS. Similarity < 99% → fix and re-run.

### When visual regression runs

- Phase 2b in `/develop-page` workflow — mandatory gate for every new component.
- Delegated to the `visual-reviewer` agent for isolated execution.
- Can also be triggered manually: "用 visual-reviewer 检查 {Component} 组件"

### Visual test files

Visual regression tests live alongside component tests:

```
ProjectCard.tsx
ProjectCard.test.tsx           # logic TDD
ProjectCard.visual.spec.ts     # visual TDD (Playwright)
```

## Running tests

```bash
# Single file
pnpm test:unit src/features/projects/components/ProjectCard.test.tsx

# Watch mode during development
pnpm test:unit --watch

# Full suite
pnpm test:unit
```

Always read the terminal output. A test that passes without the implementation existing means the test is wrong.
