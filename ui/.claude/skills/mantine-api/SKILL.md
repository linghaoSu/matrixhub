---
name: mantine-api
description: Mantine v8 component API reference. Consult when using any Mantine component, unsure about available props, choosing variants/sizes/colors, working with Table/Form/Modal/Overlay/Drawer, or about to guess a prop name. Also consult when laying out pages with Stack/Group/Flex/Grid. Trigger for ANY Mantine component usage question.
user-invocable: false
---

# Mantine v8 API Reference

This skill provides the authoritative Mantine v8 API documentation. Use it instead of guessing props.

## How to use

1. Read `references/llms-full.txt` for the component you need.
2. Search for the component name (e.g., `## Stack`, `## TextInput`) to find its props, variants, and usage.
3. If the reference file is too large to load fully, search for the specific component section.

## When to consult

- Using a Mantine component for the first time
- Unsure whether a prop exists (e.g., does `Group` have `wrap`? does `Stack` have `justify`?)
- Choosing between `variant`, `size`, or `color` values
- Working with complex components: `Table`, `Modal`, `Drawer`, `Overlay`, `Menu`, `NavLink`
- About to invent a prop name — STOP and check here first

## Full API index

The complete Mantine v8 LLM-optimized API reference is at:

```
references/llms-full.txt
```

This file is sourced from https://mantine.dev/llms-full.txt and should be periodically updated.

## Quick reminders

- Layout primitives: `Stack` (vertical), `Group` (horizontal), `Flex` (flexible), `Box` (generic), `Container` (max-width)
- Spacing props: `gap`, `p`, `m`, `pt`, `pb`, `px`, `py`, `mx`, `my` — all accept Mantine size tokens (`xs`, `sm`, `md`, `lg`, `xl`) or numbers
- Color prop: `c="blue"`, `c="gray.6"`, `c="dimmed"`
- Background: `bg="gray.1"`, `bg="blue.0"`
