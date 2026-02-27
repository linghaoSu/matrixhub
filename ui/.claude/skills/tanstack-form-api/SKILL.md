---
name: tanstack-form-api
description: TanStack Form API reference for React. Consult when creating forms, defining field validation, handling async validation, working with array fields, integrating with Mantine form components, or handling form submission. This library is relatively new and LLM training data is limited — ALWAYS verify API usage against this skill rather than guessing.
user-invocable: false
---

# TanStack Form API Reference

TanStack Form is the sole form library in this project. Its API is newer and less represented in LLM training data — always verify here rather than guessing.

## How to use

Read `references/form-api.md` for the specific API you need.

## When to consult

- Creating any form (always use TanStack Form, never native form state)
- Defining field-level or form-level validation
- Handling async validation (e.g., checking username availability)
- Working with array fields (dynamic lists)
- Integrating TanStack Form fields with Mantine components
- Handling form submission (sync or async)
- Understanding error display patterns

## Critical: Mantine integration

Do NOT use Mantine's `useForm` — it conflicts with TanStack Form.
Always bind TanStack Form field state → Mantine component props (`value`, `onChange`, `error`).
