---
paths:
  - "src/features/**/*"
  - "src/shared/**/*"
---

# Component-Driven Development & SSOT Discipline

## Component hierarchy

UI is built bottom-up in strict layers:

| Layer | Location | Description | Can depend on |
|---|---|---|---|
| **Atom** | `src/shared/ui/` or Mantine built-ins | Smallest reusable unit (Button, Input, Badge) | Nothing project-specific |
| **Molecule** | `src/features/{feature}/components/` | Combination of atoms (SearchBar, UserCard) | Atoms only |
| **Page** | `src/features/{feature}/pages/` | Full page assembled from molecules + atoms | Atoms + Molecules + Hooks |

## SSOT: Before creating any component

1. Check `docs/components-registry.md` for an existing component with matching functionality.
2. If a match exists → **reuse it**. If it's close but not exact → **extend it with new props**. If nothing fits → create new.
3. After creating a new component, you MUST update `docs/components-registry.md` (see Phase 4 in `/develop-page`).

## Component contract rules

Every new component MUST have:

- A TypeScript interface for its props (exported, named `{ComponentName}Props`)
- No hardcoded business data — all content via props or i18n
- No internal API calls — data flows in via props, events flow out via callbacks

```tsx
// ✅ Correct — generic, reusable
export interface ProjectCardProps {
  title: string
  description: string
  onEdit?: () => void
}

export function ProjectCard({ title, description, onEdit }: ProjectCardProps) {
  const { t } = useTranslation()
  return (
    <Paper p="md">
      <Stack gap="xs">
        <Title order={4}>{title}</Title>
        <Text size="sm">{description}</Text>
        {onEdit && <Button variant="light" onClick={onEdit}>{t('common.edit')}</Button>}
      </Stack>
    </Paper>
  )
}
```

```tsx
// ❌ Wrong — hardcoded, not reusable
export function ProjectCard() {
  const data = useQuery(...)  // ← fetching inside atom/molecule
  return <Paper><Text>My Project</Text></Paper>  // ← hardcoded string
}
```

## Boundary enforcement

- If a page-level file needs to fix an atom/molecule behavior → go back and fix the component + its tests. NEVER override child styles with parent CSS hacks.
- If a molecule grows beyond 3 internal atoms → consider splitting.
- If the same molecule pattern appears in 2+ features → extract to `src/shared/ui/`.
