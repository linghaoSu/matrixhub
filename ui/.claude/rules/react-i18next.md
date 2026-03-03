---
paths:
  - "src/features/**/*"
  - "src/locales/**/*"
  - "src/shared/**/*"
---

# react-i18next Namespace Discipline

## No literal strings in JSX

Every user-facing string MUST use `useTranslation()` or `<Trans>`. No exceptions.

```tsx
// ✅ Correct
const { t } = useTranslation()
return <Title>{t('projects.pageTitle')}</Title>

// ❌ Wrong — literal string
return <Title>Projects</Title>
```

## Namespace = feature name

- One locale file per feature, per language.
- Locale filename MUST equal the feature name.
- Nested features use dot notation: `projects.repositories.json`

```
src/locales/
├── en/
│   ├── projects.json
│   └── projects.repositories.json
└── zh/
    ├── projects.json
    └── projects.repositories.json
```

## Key access pattern

Keys are accessed with the feature prefix: `t('{feature}.{key}')`.

JSON files contain keys WITHOUT an extra `{feature}` wrapper:

```json
// src/locales/en/projects.json
{
  "pageTitle": "Projects",
  "createButton": "Create Project"
}
```

```tsx
// Accessed as:
t('projects.pageTitle')    // → "Projects"
t('projects.createButton') // → "Create Project"
```

## Cross-feature translations

If a string is truly shared across multiple features, place it in a `common.json` namespace under `src/locales/{lang}/common.json` and access with `t('common.{key}')`.

Do NOT duplicate the same key across multiple feature locale files.

## Adding a new feature checklist

1. Create `src/locales/en/{feature}.json` with all strings
2. Create `src/locales/zh/{feature}.json` (or other supported languages)
3. Use `useTranslation()` in all components — zero literal JSX strings
