---
name: figma-visual-convergence
description: "Converge component visual diffs to ≤ 0.01 by extracting real values from Figma design context and systematically triaging pixel deltas. Use when visual regression is failing (< 99% similarity) or when implementing a new component that requires strict Figma fidelity. Works with Figma MCP or static baselines."
---

# Figma Visual Convergence

Use this skill when a component's visual test fails (`maxDiffPixelRatio > 0.01`) and you need to systematically close the gap between implementation and design.

This skill is **tool-agnostic** (Claude Code / OpenCode / Codex) and complements:
- `/extract-design-baselines` — produces the baseline PNGs and design-context.json
- `/build-components` + `component-builder` agent — calls this skill when visual test fails
- `visual-reviewer` agent — can invoke this skill's triage checklist

---

## When to invoke this skill

- Visual test returns similarity < 99% and you don't know what's wrong
- `component-builder` agent has failed visual regression ≥ 2 times on the same component
- You can see the diff image has scattered pixel differences and need a systematic approach
- You're starting a new component and want to get the styling right the first time

## Hard constraints

- Baseline source: always Figma-node-derived. Do NOT bootstrap baselines from implementation screenshots.
- Every baseline manifest entry must include `figmaFileKey` and `figmaNodeId` (for re-export).
- Threshold is non-negotiable: `maxDiffPixelRatio: 0.01` only. Do NOT relax to pass.
- Fixture data must be deterministic. No `Math.random()`, no `Date.now()`, no `faker`.
- All values applied via Mantine theme tokens or props. No hardcoded px/hex/inline styles.

---

## Phase A: Extract real values from Figma

Before writing any CSS or Mantine props, extract the ground truth from Figma.

### If Figma MCP is available

```
→ get_design_context(node_id: "{component_node_id}")
```

Extract and record:

| Category | What to extract | Example |
|---|---|---|
| **Container** | width, height, padding, gap, border-radius, border | `w: 1440, h: 64, p: 16, gap: 12, radius: 8, border: 1px #e9ecef` |
| **Typography** | family, size, weight, line-height, letter-spacing, case, color | `Inter, 14px, 500, 20px, normal, none, #212529` |
| **Colors** | background, text, border, badge, icon | `bg: #fff, text: #212529, dimmed: #868e96` |
| **Icons/Badges** | size, spacing, ordering | `icon: 16×16, badge: h:22 px:8` |
| **Layout** | flex direction, alignment, justify, absolute offsets | `row, center, space-between` |

Save to: `__baselines__/{ComponentName}.design-context.json`

### If Figma MCP is not available

Open the baseline PNG in an image viewer. Measure:
- Container dimensions from manifest viewport
- Approximate spacing by pixel counting
- Colors using eyedropper on the baseline PNG
- Font sizes by character height comparison

This is less precise but still better than guessing.

### Map Figma values to Mantine props

| Figma value | Mantine equivalent |
|---|---|
| padding: 16px | `p="md"` (16px in default theme) |
| padding: 12px | `p="sm"` (12px) |
| padding: 8px | `p="xs"` (8px) |
| gap: 16px | `gap="md"` |
| gap: 8px | `gap="xs"` |
| border-radius: 8px | `radius="md"` |
| font-size: 14px | `size="sm"` |
| font-size: 16px | `size="md"` |
| font-weight: 500 | `fw={500}` |
| color: #868e96 | `c="dimmed"` |
| color: #228be6 | `c="blue"` |

For non-standard values, use Mantine's style API: `style={{ lineHeight: '20px' }}` — but only as a last resort.

---

## Phase B: Isolated visual mount

Visual tests must render the component in isolation, not embedded in a full page.

### Create a visual test route (if needed)

```typescript
// src/routes/__visual__/{ComponentName}.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ComponentName } from '@/features/{feature}/components/{ComponentName}'
import { fixture } from '@/features/{feature}/components/__fixtures__/{ComponentName}.fixture'

export const Route = createFileRoute('/__visual__/{ComponentName}')({
  component: () => <ComponentName {...fixture} />,
})
```

### Visual test file

```typescript
// {ComponentName}.visual.spec.ts
import { test, expect } from '@playwright/test'

test('{ComponentName} matches design baseline', async ({ page }) => {
  // Viewport from manifest — must match baseline PNG dimensions exactly
  await page.setViewportSize({ width: 1440, height: 64 })
  await page.goto('/__visual__/{ComponentName}')
  
  // Wait for render stability
  await page.waitForLoadState('networkidle')
  
  await expect(page.locator('[data-testid="{ComponentName}"]'))
    .toHaveScreenshot('{ComponentName}.png', {
      maxDiffPixelRatio: 0.01,  // HARD GATE — do not change
    })
})
```

### Fixture requirements

- Text content: exact match with Figma (same strings, same language)
- Item counts: exact match (if design shows 5 rows, fixture has 5 items)
- States: exact match (active/disabled/hover)
- Date formats: exact match (same locale formatting)
- Ordering: exact match (tags, badges, menu items)

---

## Phase C: Diff triage — systematic convergence

When the visual test fails, do NOT make random style edits. Follow this ordered checklist.

### Step 1: Get the diff image

```bash
# Run visual test, capture actual screenshot
pnpm exec playwright test {ComponentName}.visual.spec.ts --project=chromium

# The diff and actual images are typically in:
# test-results/{ComponentName}-matches-design-baseline-chromium/
#   {ComponentName}-actual.png
#   {ComponentName}-diff.png
#   {ComponentName}-expected.png
```

### Step 2: Analyze the diff image

The diff image highlights pixel differences in bright colors (typically red/magenta). Categorize the diff regions:

| Diff pattern | Likely cause |
|---|---|
| Uniform offset of all content | Container padding/margin wrong |
| Text shifted up/down | Line-height or vertical alignment wrong |
| Text different thickness | Font-weight wrong |
| Colored regions around text | Font-size wrong (characters occupy different area) |
| Scattered dots everywhere | Anti-aliasing difference (font rendering) — usually a font-family issue |
| Rectangular block of color | Background color mismatch |
| Border region highlighted | Border width/color/radius mismatch |
| Icon shape completely different | Wrong icon component (library icon ≠ Figma custom icon) |

### Step 3: Fix in priority order

Fix in this exact order. Each fix may resolve multiple diff regions:

**1. Geometry (layout structure)**

Most visual diffs come from wrong spacing. Fix these first:

```
width / height → Check manifest viewport matches component root
padding       → Compare Figma `p` with Mantine `p` prop
gap           → Compare Figma `gap` with Mantine `gap` prop
border-radius → Compare Figma `radius` with Mantine `radius` prop
border        → Width + color + style
```

**2. Typography**

Second most common source of diffs:

```
font-weight    → fw={500} vs fw={400} is visually obvious
line-height    → Affects vertical spacing of text blocks
font-size      → size="sm" (14px) vs size="md" (16px)
text-transform → Figma may show uppercase; check for `tt="uppercase"`
color          → c="dimmed" vs default; check exact hex
```

**3. Icon system**

High visual residual often comes from icon shape mismatch:

```
- Figma custom SVG icon ≠ Tabler/Lucide library icon
- Even if "same concept" (e.g., both are a gear), pixel shape differs
- Solution: export the exact icon from Figma as SVG/PNG and use it
- Or find the exact matching icon in the library by visual comparison
- Check icon size: 16×16 vs 20×20 vs 24×24 makes a big difference
```

**4. Rendering context**

If geometry + typography + icons are all correct but diff persists:

```
- Locale: zh-CN vs en-US affects character widths
- Device scale: ensure Playwright is at 1x (deviceScaleFactor: 1)
- Background color: page wrapper may add unexpected background
- Mantine theme: check if MantineProvider wraps the visual test route
```

**5. Content parity (fixture issues)**

If diff shows different text or items:

```
- Fixture text doesn't match design text exactly
- Fixture has different number of items
- Date format differs (e.g., "Jan 15" vs "2025-01-15")
- Tags/badges in different order
```

### Step 4: Run and check

After each fix:

```bash
pnpm exec playwright test {ComponentName}.visual.spec.ts --project=chromium
```

Check the new diff pixel ratio. It should decrease monotonically. If a fix increases the diff, revert it.

### Step 5: Converge

Repeat steps 2–4 until `maxDiffPixelRatio ≤ 0.01`.

Typical convergence path:
```
Attempt 1: 15.2% diff → fix padding + gap         → 4.1% diff
Attempt 2:  4.1% diff → fix font-weight + size    → 1.3% diff
Attempt 3:  1.3% diff → fix icon + border-radius  → 0.4% diff
Attempt 4:  0.4% diff → fix line-height            → 0.008% diff ✅
```

If stuck after 5 attempts:
- Re-examine the baseline: is it cropped correctly? Correct scale (1x)?
- Re-examine the fixture: does it truly match the baseline content?
- Consider that the baseline may need re-export if the design has changed

---

## Phase D: Validation

When visual test passes:

```bash
# All three must pass
pnpm typecheck                                          # type safety
pnpm test:unit {ComponentName}.test.tsx                 # logic tests
pnpm exec playwright test {ComponentName}.visual.spec.ts # pixel match ≤ 0.01

# Threshold policy gate
bash .claude/scripts/enforce-visual-threshold.sh
```

Only then: commit and proceed to next component or page assembly.

---

## Integration with other skills

| When | Invoke |
|---|---|
| Need baseline but don't have one | `/extract-design-baselines` first |
| Component-builder agent fails visual ≥ 2 times | Agent loads this skill's triage checklist |
| visual-reviewer reports FAIL with diff | Apply Phase C of this skill |
| Starting fresh component implementation | Use Phase A to extract values BEFORE coding |
