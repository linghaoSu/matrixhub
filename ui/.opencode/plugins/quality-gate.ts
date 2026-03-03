// .opencode/plugins/quality-gate.ts
//
// OpenCode plugin that replicates Claude Code's hook behavior:
// - PostToolUse (Edit|Write) → ESLint + check-component-pair.sh
// - Stop → audit-component-tests.sh
//
// Install: ensure bun is available, OpenCode auto-runs `bun install` at startup.

import type { Plugin } from "@opencode-ai/plugin"

export const QualityGatePlugin: Plugin = async ({ $, directory }) => {
  return {
    // Equivalent to Claude Code's PostToolUse: Edit|Write
    "tool.execute.after": async (input) => {
      const tool = input.tool?.toLowerCase() ?? ""
      if (tool !== "edit" && tool !== "write") return

      const filePath = (input.args?.filePath ?? input.args?.file_path ?? "") as string
      if (!filePath) return

      // Run ESLint on the edited file
      try {
        await $`pnpm eslint --no-warn-ignored --max-warnings=0 ${filePath}`.quiet()
      } catch (e) {
        // ESLint errors are informational — log but don't block
        console.log(`[quality-gate] ESLint issues in ${filePath}`)
      }

      // Run component pair check
      try {
        await $`bash .claude/scripts/check-component-pair.sh`.stdin(
          JSON.stringify({ tool_input: { file_path: filePath } })
        ).quiet()
      } catch (e) {
        // Pair check warnings are informational
      }
    },

    // Equivalent to Claude Code's Stop hook
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      // Run full audit
      try {
        const lintResult = await $`pnpm lint 2>&1 | tail -20`.quiet()
        if (lintResult.stdout) console.log(`[quality-gate] Lint:\n${lintResult.stdout}`)
      } catch {}

      try {
        const typecheckResult = await $`pnpm typecheck 2>&1 | tail -20`.quiet()
        if (typecheckResult.stdout) console.log(`[quality-gate] Typecheck:\n${typecheckResult.stdout}`)
      } catch {}

      try {
        const auditResult = await $`bash .claude/scripts/audit-component-tests.sh`.quiet()
        if (auditResult.stdout) console.log(`[quality-gate] Audit:\n${auditResult.stdout}`)
      } catch {}
    },
  }
}

export default QualityGatePlugin
