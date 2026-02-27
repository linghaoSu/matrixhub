# TanStack Form API Reference (React)

## useForm

```tsx
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: {
    name: '',
    email: '',
    age: 0,
  },

  // Form-level validation (cross-field)
  validators: {
    onChange: ({ value }) => {
      if (value.name === value.email) {
        return 'Name and email cannot be the same'
      }
      return undefined
    },
  },

  // Submit handler
  onSubmit: async ({ value }) => {
    await api.createUser(value)
  },
})
```

### Form properties

| Property | Type | Description |
|---|---|---|
| `defaultValues` | `TFormData` | Initial form values |
| `onSubmit` | `(props: { value, formApi }) => Promise<void>` | Async submit handler |
| `validators` | `{ onChange?, onBlur?, onSubmit? }` | Form-level validators |

### Form instance methods

| Method | Description |
|---|---|
| `form.handleSubmit()` | Trigger submission |
| `form.reset()` | Reset to default values |
| `form.setFieldValue(name, value)` | Programmatically set field value |
| `form.getFieldValue(name)` | Get current field value |
| `form.state` | Current form state |
| `form.Subscribe` | Subscribe to form state changes |

## form.Field

```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) =>
      !value.includes('@') ? 'Invalid email' : undefined,
    onBlur: ({ value }) =>
      !value ? 'Email is required' : undefined,
  }}
  children={(field) => (
    <>
      <TextInput
        label="Email"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.currentTarget.value)}
        onBlur={field.handleBlur}
        error={field.state.meta.errors?.[0]}
      />
    </>
  )}
/>
```

### Field props

| Prop | Type | Description |
|---|---|---|
| `name` | `keyof TFormData` | Field name (type-safe) |
| `validators` | `{ onChange?, onBlur?, onSubmit?, onChangeAsync?, onBlurAsync? }` | Field validators |
| `children` | `(field: FieldApi) => ReactNode` | Render function |
| `defaultValue` | `TData` | Override default value |

### FieldApi (inside children render function)

| Property / Method | Description |
|---|---|
| `field.state.value` | Current value |
| `field.state.meta.errors` | Array of error strings |
| `field.state.meta.isTouched` | Whether field has been blurred |
| `field.state.meta.isValidating` | Whether async validation is running |
| `field.handleChange(value)` | Update value |
| `field.handleBlur()` | Mark as touched |
| `field.setValue(value)` | Programmatic value set |

## Async validation

```tsx
<form.Field
  name="username"
  validators={{
    onChangeAsync: async ({ value }) => {
      const available = await checkUsername(value)
      return available ? undefined : 'Username taken'
    },
    onChangeAsyncDebounceMs: 500,
  }}
  children={(field) => (
    <TextInput
      label="Username"
      value={field.state.value}
      onChange={(e) => field.handleChange(e.currentTarget.value)}
      error={field.state.meta.errors?.[0]}
      rightSection={field.state.meta.isValidating ? <Loader size="xs" /> : null}
    />
  )}
/>
```

## Array fields

```tsx
<form.Field
  name="tags"
  mode="array"
  children={(field) => (
    <Stack gap="xs">
      {field.state.value.map((_, index) => (
        <form.Field
          key={index}
          name={`tags[${index}]`}
          children={(subField) => (
            <Group>
              <TextInput
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.currentTarget.value)}
              />
              <ActionIcon onClick={() => field.removeValue(index)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          )}
        />
      ))}
      <Button variant="light" onClick={() => field.pushValue('')}>
        Add Tag
      </Button>
    </Stack>
  )}
/>
```

### Array field methods

| Method | Description |
|---|---|
| `field.pushValue(value)` | Append to array |
| `field.removeValue(index)` | Remove by index |
| `field.insertValue(index, value)` | Insert at index |
| `field.moveValue(from, to)` | Reorder |
| `field.swapValues(indexA, indexB)` | Swap positions |

## Form submission pattern

```tsx
// Standard form with Mantine Button
<form
  onSubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
>
  {/* fields */}

  <form.Subscribe
    selector={(state) => [state.canSubmit, state.isSubmitting]}
    children={([canSubmit, isSubmitting]) => (
      <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
        Submit
      </Button>
    )}
  />
</form>
```

## Integration with Mantine: Quick Reference

| Mantine Component | TanStack Form binding |
|---|---|
| `TextInput` | `value={field.state.value}` `onChange={(e) => field.handleChange(e.currentTarget.value)}` |
| `NumberInput` | `value={field.state.value}` `onChange={(val) => field.handleChange(val ?? 0)}` |
| `Select` | `value={field.state.value}` `onChange={(val) => field.handleChange(val ?? '')}` |
| `Checkbox` | `checked={field.state.value}` `onChange={(e) => field.handleChange(e.currentTarget.checked)}` |
| `Switch` | `checked={field.state.value}` `onChange={(e) => field.handleChange(e.currentTarget.checked)}` |
| `Textarea` | `value={field.state.value}` `onChange={(e) => field.handleChange(e.currentTarget.value)}` |
| All components | `error={field.state.meta.errors?.[0]}` `onBlur={field.handleBlur}` |

**IMPORTANT**: Never use `@mantine/form`'s `useForm` — it conflicts with TanStack Form.
