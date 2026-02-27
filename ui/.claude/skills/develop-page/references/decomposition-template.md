# Component Decomposition Template

Use this template when producing the Phase 1 decomposition tree.

## Tree format

```
{PageName} (Page — NEW)
├── {ComponentA} (Molecule — EXISTING: {path})
│   ├── {MantineComponent} ← Mantine
│   └── {MantineComponent} ← Mantine
├── {ComponentB} (Molecule — NEW)
│   ├── {MantineComponent} ← Mantine
│   └── {ComponentC} (Atom — NEW)
│       └── {MantineComponent} ← Mantine
└── {ComponentD} (Atom — EXISTING: {path})
```

## Labels

- `EXISTING: {path}` — component exists, will be reused. Cite the file path.
- `NEW` — must be created in Phase 2. Requires Props interface.
- `← Mantine` — Mantine built-in, no action needed.

## Contract template for NEW components

```typescript
/**
 * {ComponentName}
 * 
 * {One-sentence description}
 * 
 * Layer: Atom | Molecule
 * Location: src/features/{feature}/components/{ComponentName}.tsx
 */
export interface {ComponentName}Props {
  /** {description} */
  propA: string
  /** {description} */
  propB?: number
  /** {description} */
  onAction?: () => void
}
```

## Checklist before advancing to Phase 2

- [ ] Every Mantine built-in is labeled `← Mantine` (not recreated)
- [ ] Every EXISTING component cites its file path
- [ ] Every NEW component has a complete Props interface
- [ ] No component fetches data internally
- [ ] No component contains hardcoded business strings
- [ ] Hierarchy is strictly Atom → Molecule → Page (no cycles)
