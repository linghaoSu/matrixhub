---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Mantine v8 Coding Discipline

Mantine v8 is the sole component library. All layout, spacing, and styling MUST use Mantine components and theme tokens.

## Layout

Use Mantine primitives instead of raw `<div>`:

- `Stack`, `Group`, `Flex`, `Box`, `Container`

```tsx
// ✅ Correct
import { Stack, Group, Title, Button } from '@mantine/core'

export function LabelPage() {
  return (
    <Stack gap="md" mx="sm">
      <Group gap="sm">
        <Title order={3}>Labels</Title>
        <Button>Create</Button>
      </Group>
    </Stack>
  )
}
```

```tsx
// ❌ Wrong — raw div with inline styles
<div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
  <h3>Labels</h3>
  <button>Create</button>
</div>
```

## Spacing & styling

- Use Mantine spacing props: `gap`, `p`, `m`, `pt`, `pb`, `mx`, etc.
- Use Mantine theme tokens for colors: `c="blue"`, `bg="gray.1"`
- No hardcoded colors, radius, or font sizes.
- No inline `style={{}}` when Mantine provides an equivalent prop.

```tsx
// ✅ Correct
<Button variant="light" c="blue">Save</Button>

// ❌ Wrong
<Button style={{ background: '#1677ff' }}>Save</Button>
```

## Reuse

- Shared UI primitives live in `src/shared/ui/`.
- Repeated layout or shell patterns MUST be extracted into shared components.
- Do not duplicate spacing / layout logic across features.

## When unsure about an API

Never guess Mantine props. When using a component for the first time, unsure about available props, or about to invent a prop name — consult the `mantine-api` skill which contains the full Mantine v8 API reference.
