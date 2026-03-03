# .agents/ — Codex Skills Discovery

Codex looks for skills in `.agents/skills/*/SKILL.md`.
Our skills are maintained in `.claude/skills/` (shared with Claude Code and OpenCode).

## Setup

Create a symlink so Codex discovers the same skills:

```bash
cd .agents
ln -s ../.claude/skills skills
```

Or copy if symlinks aren't supported in your environment:

```bash
cp -r .claude/skills .agents/skills
```

After setup, Codex will discover:
- `$plan-page`
- `$build-components`
- `$assemble-page`
- `$extract-design-baselines`
- `$create-feature`
- `$mantine-api`
- `$tanstack-router-api`
- `$tanstack-form-api`
- `$figma-to-code`
