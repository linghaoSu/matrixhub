---
paths:
  - "src/features/**/components/**"
  - "src/features/**/pages/**"
---

# TanStack Form Discipline

## Use TanStack Form for all forms

Every form in this project uses TanStack Form. Do not use uncontrolled forms, native form state, or other form libraries.

```tsx
// ✅ Correct
import { useForm } from '@tanstack/react-form'

function CreateProjectForm() {
  const form = useForm({
    defaultValues: { name: '', description: '' },
    onSubmit: async ({ value }) => {
      await createProject(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <TextInput
            label={t('projects.nameLabel')}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.currentTarget.value)}
            error={field.state.meta.errors?.[0]}
          />
        )}
      />
    </form>
  )
}
```

## Validation

- Use TanStack Form's `validators` prop for field-level validation.
- Use `onSubmit` validators for form-level / cross-field validation.
- Display errors through Mantine's `error` prop on form components.

## Integration with Mantine

- Always use Mantine form components (`TextInput`, `Select`, `Checkbox`, etc.) as the UI layer.
- Bind TanStack Form's field state to Mantine's `value`, `onChange`, and `error` props.
- Do NOT use Mantine's `useForm` hook — it conflicts with TanStack Form.

## When unsure about Form API

Consult the `tanstack-form-api` skill for `useForm` options, field validators, async validation, and array field patterns.
