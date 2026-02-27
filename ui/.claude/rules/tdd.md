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
- Visual pixel accuracy (covered by visual regression agent)

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
