---
name: figma-to-code
description: Convert Figma designs to Mantine component code. Use when the user provides a Figma screenshot, design mockup, UI specification, or asks to implement a page/component from a design. Contains design token to Mantine prop mappings for accurate design reproduction.
---

# Figma → Mantine Code

Convert Figma designs into production Mantine v8 code that matches the project's theme and conventions.

## How to use

1. User provides a Figma screenshot or design description.
2. Read `references/component-mapping.md` for token → Mantine prop mappings.
3. Generate code using only Mantine components and theme tokens.
4. Wrap all text in `t()` calls following i18n conventions.

## Process

### Step 1: Analyze the design

Identify from the design:
- Layout structure (vertical stacks, horizontal groups, grids)
- Component types (buttons, inputs, cards, tables, modals)
- Spacing rhythm (gaps between elements)
- Typography hierarchy (headings, body, captions)
- Color usage (backgrounds, text, accents)

### Step 2: Map to Mantine

Consult `references/component-mapping.md` for exact mappings.

Key principles:
- Every layout element → Mantine primitive (`Stack`, `Group`, `Flex`, `Grid`)
- Every spacing value → Mantine token (`xs`, `sm`, `md`, `lg`, `xl`)
- Every color → Mantine theme color (`blue.6`, `gray.3`, `dimmed`)
- Every text style → Mantine `Title` (order 1–6) or `Text` (size/weight)
- No raw `<div>`, no inline styles, no hardcoded values

### Step 3: Generate code

- Follow all rules in `.claude/rules/mantine.md`
- All strings in `t()` — follow `.claude/rules/react-i18next.md`
- Forms use TanStack Form — follow `.claude/rules/tanstack-form.md`
- Page components follow feature directory structure

### Step 4: Verify

- Does the generated code use ONLY Mantine components?
- Are all spacing values theme tokens (not px values)?
- Are all colors from the theme (not hex codes)?
- Are all strings wrapped in `t()`?
- Does the layout match the design's visual hierarchy?
