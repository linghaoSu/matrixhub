# Claude Code 配置架构说明

本文档说明 `CLAUDE.md`、`.claude/rules/`、`.claude/skills/`、`.claude/agents/` 的分工逻辑。

## 核心原则

```
CLAUDE.md  = 宪法        始终加载，不可变的约束和哲学
Rules      = 法律        始终生效，path-scoped 的编码纪律
Skills     = 工具箱      按需加载的 API 参考 + 可触发的工作流
Agents     = 专家顾问    隔离上下文的专用角色
Hooks      = 自动执法    确定性脚本，每次 Edit/Write 后跑 lint，Stop 时跑全量检查
```

## 原始需求文档是如何被拆解的

原始的 "Role & Operating Philosophy" 文档包含了混合的内容：始终生效的哲学、分阶段工作流、和具体禁令。在 Claude Code 中，这些需要放在不同的地方：

| 原始内容 | 性质 | 落地位置 | 原因 |
|---|---|---|---|
| TDD / CDD / SSOT 哲学 | 始终生效的约束 | `CLAUDE.md` (Forbidden 列表) | 无论做什么改动都必须遵守 |
| "禁止硬编码"等红线 | 始终生效的约束 | `CLAUDE.md` + `rules/` | 需要在每次写代码时自动提醒 |
| Phase 0–4 工作流 | 可触发的工作流 | `skills/develop-page/` | 只在做页面级开发时需要，不应该每次改 typo 都加载 |
| 视觉回归测试 | 需要隔离上下文 | `agents/visual-reviewer` | 要运行 Playwright、读截图、不污染主编码会话 |
| 组件注册表更新 | 流程中的一步 | `develop-page` skill Phase 4 | 作为工作流的最后一步执行 |
| Lint / Typecheck 门禁 | 确定性自动化 | `settings.json` hooks | 不靠 LLM "记得"跑 lint，每次 Edit 后自动执行 |

**关键设计决策**：如果把完整的 Phase 0–4 流程放在 `CLAUDE.md` 里，那每次会话（包括改一行 CSS、修一个 typo）都会加载 200+ 行的工作流说明，浪费上下文窗口。做成 skill 后，只有显式调用 `/develop-page` 时才加载。但 TDD 和 CDD 的**基本纪律**仍然在 rules 中始终生效——即使不走完整工作流，改一行代码也必须有对应测试。

## 文件结构

```
ui/
├── CLAUDE.md                                 # 宪法（~100 行，始终加载）
│
└── .claude/
    ├── rules/                                # 法律（始终加载，path-scoped）
    │   ├── tdd.md                            # Red → Green → Refactor 纪律
    │   ├── component-driven.md               # CDD 层级 + SSOT 检查
    │   ├── api-layer.md                      # API 抽象层隔离（mock ≠ 业务代码）
    │   ├── mantine.md                        # Mantine 原语优先
    │   ├── tanstack-router.md                # 路由文件只做适配
    │   ├── tanstack-form.md                  # TanStack Form 唯一
    │   ├── react-i18next.md                  # 零 literal string
    │   └── console-route-checklist.md        # 合并前检查清单
    │
    ├── skills/                               # 工具箱（按需加载）
    │   ├── develop-page/                     # /develop-page — Phase 0–4 完整工作流
    │   │   ├── SKILL.md                      #   disable-model-invocation: true
    │   │   └── references/                   #   context: fork（在子代理中运行）
    │   │       └── decomposition-template.md
    │   │
    │   ├── mantine-api/                      # API 参考：自动触发
    │   │   ├── SKILL.md
    │   │   └── references/
    │   │       └── llms-full.txt
    │   │
    │   ├── tanstack-router-api/              # API 参考：自动触发
    │   │   ├── SKILL.md
    │   │   └── references/
    │   │       └── router-api.md
    │   │
    │   ├── tanstack-form-api/                # API 参考：自动触发
    │   │   ├── SKILL.md
    │   │   └── references/
    │   │       └── form-api.md
    │   │
    │   ├── create-feature/                   # /create-feature — 脚手架
    │   │   ├── SKILL.md
    │   │   └── scripts/
    │   │       └── create-feature.sh
    │   │
    │   └── figma-to-code/                    # 设计稿 → 代码映射
    │       ├── SKILL.md
    │       └── references/
    │           └── component-mapping.md
    │
    └── agents/                               # 专家顾问（隔离上下文）
        ├── ui-reviewer.md                    # 代码审查（TDD + CDD + 全规范检查）
        └── visual-reviewer.md                # 视觉回归（Playwright 截图对比）
```

## Hooks 详解（`.claude/settings.json`）

Hooks 是确定性自动化——不依赖 LLM 判断，每次触发条件满足时必定执行。

### PostToolUse: Edit|Write → 单文件 ESLint

```json
{
  "matcher": "Edit|Write",
  "command": "jq -r '.tool_input.file_path // empty' | xargs -I{} pnpm eslint --no-warn-ignored --max-warnings=0 {} 2>&1 || true"
}
```

**作用**：Claude 每次编辑或创建文件后，立即对该文件运行 ESLint。错误信息作为 `additionalContext` 反馈给 Claude，Claude 看到后会自行修复。

**为什么用 `|| true`**：让 hook 本身不 fail（不阻断 Claude 的工作流），但 lint 错误仍然通过 stdout 反馈给 Claude。

**timeout: 30s**：单文件 lint 应该很快，30 秒超时防止挂起。

### Stop → 全量 lint + typecheck

```json
{
  "command": "echo '--- Running final quality gate ---' && pnpm lint 2>&1 | tail -20 && pnpm typecheck 2>&1 | tail -20"
}
```

**作用**：Claude 每次完成回答（Stop 事件）时，跑完整的 `pnpm lint` 和 `pnpm typecheck`。如果有错误，Claude 会在下一轮看到并修复。

**为什么 `tail -20`**：避免大量输出淹没上下文窗口，只保留最后 20 行（通常是错误摘要）。

**timeout: 120s**：全量 lint + typecheck 对大项目可能较慢。

### 为什么用 Hook 而不是 Rule

| 方式 | 机制 | 可靠性 |
|---|---|---|
| Rule 里写"记得跑 lint" | 靠 LLM 记住并主动执行 | ❌ 会忘，尤其长会话 |
| Hook (PostToolUse) | 确定性脚本，每次 Edit 自动触发 | ✅ 100% 执行 |
| Hook (Stop) | 确定性脚本，每轮回答结束自动触发 | ✅ 100% 执行 |

Hook 是 Claude Code 中唯一的"确定性执法"机制。lint 这种"必须每次都做"的事情，只有 Hook 能保证。

## 加载时机与上下文开销

| 层级 | 何时加载 | 上下文开销 |
|------|---------|-----------|
| `CLAUDE.md` | 每次会话启动 | ~100 行，始终占用 |
| `.claude/rules/*.md` | 会话启动，path-scoped 精确匹配 | 共 ~400 行，按文件匹配 |
| Skill descriptions | 会话启动（仅 name + description） | 每个 ~30 词，极小 |
| Skill full content | `/develop-page` 等手动触发时 | 仅在使用时加载 |
| Skill references | Skill 指示读取时 | 仅在需要时 |
| Agents | Claude 委派任务时 | 独立上下文，不占主会话 |

## Rules 详解

### 始终生效 vs Path-Scoped

所有 rules 在会话启动时都会被注册，但 path-scoped rules 只在 Claude 操作匹配路径的文件时才生效：

| Rule | Paths | 何时生效 |
|---|---|---|
| `tdd.md` | `src/**/*.ts(x)`, `**/*.test.*` | 写任何源码或测试时 |
| `component-driven.md` | `src/features/**`, `src/shared/**` | 写组件或共享代码时 |
| `api-layer.md` | `src/features/**`, `src/shared/api/**` | 涉及 API 调用或数据类型时 |
| `mantine.md` | `src/**/*.ts(x)` | 写任何 TSX 代码时 |
| `tanstack-router.md` | `src/routes/**` | 改路由文件时 |
| `tanstack-form.md` | `src/features/**/components, pages` | 写表单相关组件时 |
| `react-i18next.md` | `src/features, locales, shared` | 涉及文本或翻译时 |
| `console-route-checklist.md` | `src/routes, features/**/pages` | 改路由或页面时 |

### 为什么 TDD 和 CDD 同时在 CLAUDE.md 和 Rules 中

- `CLAUDE.md` 的 Forbidden 列表提供**高层级禁令**（"禁止在没有测试的情况下写实现"）——这是 Claude 在做任何事情时都会看到的。
- `rules/tdd.md` 和 `rules/component-driven.md` 提供**具体操作指南**（怎么写测试、怎么组织组件层级）——只在操作源码文件时详细展开。

这样避免了 CLAUDE.md 过长，同时确保核心纪律不会被遗漏。

## Skills 详解

### 人工触发 vs 自动触发

| Skill | 触发方式 | 为什么 |
|---|---|---|
| `/develop-page` | 人工 | Phase 0–4 是重量级流程，不应该自动运行 |
| `/create-feature` | 人工 | 创建文件有副作用 |
| `mantine-api` | Claude 自动 | 不确定 API 时自动查阅，无副作用 |
| `tanstack-router-api` | Claude 自动 | 同上 |
| `tanstack-form-api` | Claude 自动 | 同上 |
| `figma-to-code` | Claude 自动 | 收到设计稿时自动加载映射表 |

### develop-page 的 context: fork

`develop-page` 设置了 `context: fork`，意味着它在一个子代理中运行，有自己的上下文窗口。这是因为：
- Phase 0 需要读取大量文件（registry、locales、routes）
- Phase 2 需要反复运行测试、读取终端输出
- 这些中间过程不应污染主会话的上下文

## Agents 详解

| Agent | 工具权限 | 预加载 Skills | 用途 |
|---|---|---|---|
| `ui-reviewer` | Read, Glob, Grep | mantine-api, tanstack-form-api, tanstack-router-api | PR 审查 |
| `visual-reviewer` | Read, Bash, Glob | (none) | 视觉回归测试 |

两个 agent 都是只读或受限权限——reviewer 不能修改代码（只能建议），visual-reviewer 只能运行 Playwright 截图。

## 日常使用场景

### 场景 1：开发新页面（完整流程）

```
/develop-page "实现项目仓库列表页，参考 Figma 链接..."
```

Claude 进入 fork 上下文，按 Phase 0→1→2→3→4 执行。

### 场景 2：修改一个组件（小改动）

直接告诉 Claude 要改什么。Rules（TDD、Mantine、CDD）自动生效，Claude 会：
1. 先写/更新测试
2. 然后改实现
3. 运行测试确认通过

不需要走完整的 Phase 0–4。

### 场景 3：修复一个 bug

```
"ProjectCard 组件的删除按钮没有触发回调"
```

TDD rule 自动生效 → Claude 先写一个复现 bug 的测试（Red），再修复（Green）。

### 场景 4：代码审查

Claude 自动委派给 `ui-reviewer` agent，返回违规报告。

### 场景 5：视觉检查

在 `/develop-page` 的 Phase 2b 中自动触发，或手动要求：

```
"用 visual-reviewer 检查 ProjectCard 组件是否与 Figma 一致"
```
