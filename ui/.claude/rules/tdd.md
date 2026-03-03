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

This rule covers three distinct concepts. Do not confuse them.

| Concept | What it does | When it runs | Tool |
|---|---|---|---|
| **Unit TDD** | Verifies component logic (props, events, rendering) | `pnpm test:unit` — you run it | Vitest + Testing Library |
| **Visual TDD** | Pixel-compares a screenshot against a design baseline | `pnpm exec playwright test` — you run it | Playwright + pixelmatch |
| **File inventory** | Checks that companion files exist (not corrupt) | Hooks run it automatically | Shell scripts |

File inventory ≠ visual TDD. The hooks only check "does `*.visual.spec.ts` exist as a file?" — they never execute Playwright or evaluate pixel similarity.

---

## 1. Unit TDD: Red → Green → Refactor

Every implementation change follows this cycle:

1. **Red** — Write or update a test that describes expected behavior. Run `pnpm test:unit <file>` and confirm it FAILS.
2. **Green** — Write the minimum implementation to make the test pass. Run the test again and confirm it PASSES.
3. **Refactor** — Clean up the code while keeping tests green.

### What counts as "failing test first"

- New component → write `.test.tsx` with `describe('{ComponentName}', ...)` covering render, props, interactions, edges BEFORE the component.
- New hook → write test covering return values, state transitions, error cases BEFORE implementing.
- Bug fix → write a test that reproduces the bug (must fail on current code) BEFORE fixing.

### Test conventions

- Unit tests live alongside the code: `{Name}.test.tsx` next to `{Name}.tsx`
- `@testing-library/react` for component tests
- `vitest` for assertions and mocking
- Mock all external dependencies (API calls, router, i18n)

### What NOT to unit-test

- Mantine component internals (trust the library)
- Router navigation (covered by E2E)
- Pixel-level appearance (that's Visual TDD — see section 2)

---

## 2. Visual TDD: Playwright pixel comparison

This is a **separate test execution** from unit tests. It runs Playwright, takes a real browser screenshot, and compares it pixel-by-pixel against a design baseline image.

### The cycle

1. Ensure baseline exists: `__baselines__/{Name}.baseline.png` (from `/extract-design-baselines`)
2. Ensure fixture exists: `__fixtures__/{Name}.fixture.ts` (data matching the design exactly)
3. Write `{Name}.visual.spec.ts`:
   ```typescript
   test('{Name} matches design', async ({ page }) => {
     await page.setViewportSize({ width: 1440, height: 64 }) // from manifest
     // mount component with fixture data
     await expect(page.locator('[data-testid="{Name}"]'))
       .toHaveScreenshot('{Name}.png', { maxDiffPixelRatio: 0.01 })
   })
   ```
4. Run: `pnpm exec playwright test {Name}.visual.spec.ts`
5. Result: ≥ 99% similarity → PASS. < 99% → fix Mantine props and re-run.

### When visual TDD runs

- **Phase 2b** of the component build workflow — mandatory for every new component
- Executed by the `component-builder` agent or manually
- Can also be delegated to the `visual-reviewer` agent for diagnosis
- ≥ 99% is a **hard gate** — the component cannot be used in page assembly until it passes

### When visual TDD fails

Do NOT relax `maxDiffPixelRatio` to make the test pass. Instead:

1. Load `/figma-visual-convergence` skill
2. Follow Phase C (Diff triage) — fix in order: geometry → typography → icons → context → content
3. Each fix should decrease the diff monotonically
4. Run `bash .claude/scripts/enforce-visual-threshold.sh` to verify no threshold was relaxed

### File layout

```
ProjectCard.tsx                    # component
ProjectCard.test.tsx               # unit TDD (logic)
ProjectCard.visual.spec.ts         # visual TDD (pixel comparison)
__fixtures__/
  ProjectCard.fixture.ts           # mock data matching Figma
__baselines__/
  ProjectCard.baseline.png         # design reference image
  manifest.ts                      # viewport + tolerance config
```

---

## 3. File inventory (automated, not test execution)

The PostToolUse and Stop hooks run shell scripts that check whether companion files **exist**. These scripts:

- ✅ Verify file existence (`.test.tsx`, `.visual.spec.ts`, `.fixture.ts`, `.baseline.png`)
- ✅ Verify baseline PNG integrity (file size > 100 bytes, valid PNG header)
- ❌ Do NOT run `pnpm test:unit`
- ❌ Do NOT run `pnpm exec playwright test`
- ❌ Do NOT evaluate pixel similarity percentages
- ❌ Do NOT determine PASS/FAIL of any test

If a hook script reports "⚠️ MISSING FILES", it means you need to **create the file**. After creating it, you still need to **run the actual test** to verify it passes:

```bash
# After creating the files:
pnpm test:unit {Name}.test.tsx                     # run unit tests
pnpm exec playwright test {Name}.visual.spec.ts    # run pixel comparison
```

---

## Running tests

```bash
# Unit tests — single file
pnpm test:unit src/features/projects/components/ProjectCard.test.tsx

# Unit tests — watch mode during development
pnpm test:unit --watch

# Unit tests — full suite
pnpm test:unit

# Visual tests — single component
pnpm exec playwright test ProjectCard.visual.spec.ts

# Visual tests — full suite
pnpm exec playwright test
```

Always read the terminal output. A test that passes without the implementation existing means the test is wrong.
