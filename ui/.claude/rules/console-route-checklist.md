---
paths:
  - "src/routes/**/*"
  - "src/features/**/pages/**"
---

# Console Route Checklist

Before merging any route-related change, verify all items:

## Route file (`src/routes/`)

- [ ] Uses `createFileRoute` — no manual router config
- [ ] Imports and mounts a single feature page component
- [ ] Contains zero UI logic (no JSX beyond component assignment)
- [ ] Contains zero business logic
- [ ] `loader` / `beforeLoad` only fetch data or check auth — no side effects

## Feature page (`src/features/**/pages/`)

- [ ] All user-facing strings wrapped in `t()`
- [ ] Layout uses Mantine primitives (`Stack`, `Group`, `Box`), not raw `<div>`
- [ ] No hardcoded colors, spacing, or typography
- [ ] Forms use TanStack Form (not native state or Mantine useForm)
- [ ] Page component is the default export

## Locale files (`src/locales/`)

- [ ] New namespace JSON file exists for all supported languages
- [ ] Filename matches feature name exactly
- [ ] No duplicate keys that exist in other namespace files
