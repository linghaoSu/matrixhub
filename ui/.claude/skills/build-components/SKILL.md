---
name: build-components
description: "Phase 2 of page development: read the master plan from /plan-page, spawn parallel sub-agents (each in its own worktree) to build, test, and visually verify individual components. Each agent follows its component work plan independently. After all agents complete, merge results back to the feature branch. Run AFTER /plan-page, BEFORE /assemble-page."
disable-model-invocation: true
---

# Build Components (Phase 2 of 3)

Invoke: `/build-components docs/work-plans/plan.md`

This skill reads the master plan, respects the dependency graph, and dispatches parallel sub-agents to build components.

## Prerequisites

- `/plan-page` has been run and committed
- `docs/work-plans/plan.md` exists with component list and dependency graph
- `docs/work-plans/{Component}.plan.md` exists for each component
- `__baselines__/` contains validated PNG baselines

## Workflow

### Step 1: Read the master plan

Parse `docs/work-plans/plan.md` to get:

- List of components to build
- Dependency graph (which can run in parallel, which must wait)
- Feature branch name

### Step 2: Identify parallel groups

From the dependency graph, determine execution groups:

```
Group 1 (parallel): RepositoryRow, RepositoryFilters
  → No dependencies, can start immediately

Group 2 (after Group 1 merges): RepositoryTable
  → Depends on RepositoryRow
```

### Step 3: Dispatch Group 1 (parallel agents)

For each component in the first parallel group, create a sub-agent using the Task tool with `run_in_background: true`:

```
For each component in Group 1:

  Task: "Build {ComponentName} following docs/work-plans/{ComponentName}.plan.md"
  
  Agent: component-builder (see agents/component-builder.md)
  Isolation: worktree (each agent gets its own git worktree)
  Branch: feat/{page-name}/{ComponentName}
  
  The agent will:
  1. Read its work plan
  2. Create fixture + unit test (RED)
  3. Implement the component (GREEN)
  4. Run visual regression against baseline (≥ 99%)
  5. Run lint + typecheck
  6. Commit and write RESULTS.md
```

### Step 4: Monitor Group 1

Poll `.agent-status/{component}.json` or wait for all background tasks to complete.

For each completed agent, verify:

```
{ComponentName}:
  Unit tests:        ✅ passing / ❌ failed
  Visual regression: ✅ {similarity}% / ❌ failed
  Lint:              ✅ clean / ❌ errors
  Typecheck:         ✅ clean / ❌ errors
  Commit:            {commit hash}
```

**If any agent fails:** Do NOT proceed. Report the failure and suggest re-running that specific agent:

```
❌ RepositoryRow agent failed:
  Visual regression: 94.2% (< 99% threshold)
  See: .claude/worktrees/RepositoryRow/RESULTS.md for details
  
  Fix: review the diff, adjust the component, re-run:
  /build-components docs/work-plans/plan.md --only RepositoryRow
```

### Step 5: Merge Group 1

After all Group 1 agents pass:

```bash
git checkout feat/{page-name}

# Merge each completed component branch
for component in Group1; do
  git merge feat/{page-name}/${component} --no-ff -m "feat({page-name}): merge ${component}"
done

# Verify no conflicts
pnpm lint && pnpm typecheck && pnpm test:unit
```

**If merge conflicts occur:** Resolve them manually, run tests, then continue.

### Step 6: Dispatch Group 2 (sequential dependencies)

Repeat Steps 3–5 for the next group. These agents start from the merged state of Group 1, so they can import the components built in Group 1.

### Step 7: Final merge and commit

After all groups are merged:

```bash
git checkout feat/{page-name}
pnpm lint && pnpm typecheck && pnpm test:unit

# All component tests should still pass
git push origin feat/{page-name}
```

### Step 8: Cleanup worktrees

```bash
# Remove all component worktrees
for component in all_components; do
  git worktree remove .claude/worktrees/${component} --force 2>/dev/null
done
git worktree prune
```

## Output summary

```
━━━ BUILD-COMPONENTS COMPLETE ━━━
Branch: feat/project-repositories
Components built: 3/3

Group 1 (parallel):
  ✅ RepositoryRow      — tests: ✅ — visual: 99.7% — merged
  ✅ RepositoryFilters  — tests: ✅ — visual: 99.2% — merged

Group 2 (sequential):
  ✅ RepositoryTable    — tests: ✅ — visual: 99.4% — merged

All merged to feat/project-repositories
Lint: ✅  Typecheck: ✅  Unit tests: ✅

Next step: /assemble-page docs/work-plans/plan.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Re-running individual components

If a component fails and needs re-work:

```
/build-components docs/work-plans/plan.md --only RepositoryRow
```

This spawns a single agent for that component only, using the same work plan.

## Error handling

| Issue | Action |
|---|---|
| Agent times out | Check worktree for partial work, re-dispatch |
| Visual regression < 99% | Agent's RESULTS.md has the diff analysis — fix and retry |
| Merge conflict | Resolve manually, run tests, continue |
| Baseline missing/corrupt | Run `/extract-design-baselines` to re-export, then retry |
| Agent produces wrong files | Check work plan for errors, fix plan, re-dispatch |
