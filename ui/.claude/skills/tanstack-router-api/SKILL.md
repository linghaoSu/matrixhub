---
name: tanstack-router-api
description: TanStack Router file-based routing API reference. Consult when creating routes, defining layouts, using search params, writing loaders/beforeLoad, setting up route context, or working with route groups and pathless layouts. Trigger for any TanStack Router API question.
user-invocable: false
---

# TanStack Router API Reference

This skill provides curated TanStack Router API documentation relevant to this project's file-based routing setup.

## How to use

Read `references/router-api.md` for the specific API you need.

## When to consult

- Creating a new route file with `createFileRoute`
- Defining layout routes (`_layout.tsx`)
- Using route groups with parentheses `(group)/`
- Defining typed search params or path params
- Writing `loader` or `beforeLoad` functions
- Setting up route context with `createRootRouteWithContext`
- Configuring `pendingComponent` or `errorComponent`
- Understanding how file-based routing maps to URL paths

## Key concepts for this project

- All routing is file-based — never use `createRouter` with manual route trees
- `routeTree.gen.ts` is auto-generated and read-only
- Route files are adapters only — see `.claude/rules/tanstack-router.md` for constraints
