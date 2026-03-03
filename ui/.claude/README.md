# Claude Code 配置架构说明

## 跨平台兼容

本配置同时支持 **Claude Code**、**OpenCode** 和 **Codex**。核心内容维护在一处，适配层自动桥接。

```
                        CLAUDE.md (Claude Code 入口)
                        AGENTS.md (OpenCode / Codex 入口，内容 = CLAUDE.md + rules 内联)
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
          Claude Code    OpenCode      Codex
                │           │           │
  .claude/rules/     (AGENTS.md 内联)  (AGENTS.md 内联)
  .claude/skills/    .claude/skills/   ❌ 不支持
  .claude/agents/    .opencode/agents/ ❌ 不支持
  settings.json      .opencode/plugins/ Makefile
  (hooks)            (quality-gate.ts)  (make gate)
```

### 什么是自动兼容的

| 功能 | Claude Code | OpenCode | Codex |
|---|---|---|---|
| 项目规则 | `CLAUDE.md` | `AGENTS.md`（兼容 `CLAUDE.md`） | `AGENTS.md`（兼容 `CLAUDE.md` via fallback） |
| Skills | `.claude/skills/` | ✅ 原生兼容 | ✅ 通过 `.agents/skills/` 符号链接 |
| Path-scoped rules | `.claude/rules/` | ⚠️ 内联到 `AGENTS.md` | ⚠️ 内联到 `AGENTS.md` |
| Agents | `.claude/agents/` (frontmatter) | `.opencode/agents/` (转换 frontmatter) | `.codex/config.toml` [agents] + TOML profiles |
| Hooks | `settings.json` | `.opencode/plugins/quality-gate.ts` | `notify` (仅 agent-turn-complete) + `Makefile` |
| Worktree 并行 | `isolation: worktree` | ✅ 原生支持 | ✅ Codex app worktree threads + multi-agent |
| 验证脚本 | hooks 自动调用 | plugin 自动调用 | `make gate` 手动 / notify 触发 |

## 核心原则

```
CLAUDE.md     = 宪法        始终加载，不可变的约束
Rules         = 法律        始终生效，path-scoped 的编码纪律
Skills        = 工具箱      按需加载的 API 参考 + 可触发的工作流
Agents        = 执行者      隔离上下文的专用角色（worktree 并行）
Hooks         = 自动执法    确定性脚本，不靠 LLM 记忆
Scripts       = 基础设施    被 hooks 和 skills 调用的验证/裁剪脚本
```

## 三阶段页面开发流程

旧方案是一个 `/develop-page` 在一次对话中走完 Phase 0–4。问题是：5+ 组件的页面对单次会话的 context window 压力太大，而且组件之间本来就是独立的。

新方案拆成三次独立运行，其中第二阶段支持并行：

```
┌─────────────────────────────────────────────────────┐
│ Phase 1: /plan-page                                 │
│ (单次会话, 单人)                                      │
│                                                     │
│ 读 registry → 拆解组件树 → 定义契约 → 提取 baseline  │
│ → 生成每个组件的独立工作计划 → commit                  │
│                                                     │
│ 输出: docs/work-plans/{Component}.plan.md            │
│       __baselines__/{Component}.baseline.png          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ Phase 2: /build-components                          │
│ (多个 agent, 并行 worktree)                          │
│                                                     │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ │ agent-1  │  │ agent-2  │  │ agent-3  │  (等待)   │
│ │ Row      │  │ Filters  │  │ Table    │           │
│ │ worktree │  │ worktree │  │ (依赖Row)│           │
│ └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│      │ commit      │ commit      │ commit           │
│      └──────┬──────┘             │                  │
│             │ merge              │ merge             │
│             └────────────────────┘                   │
│                                                     │
│ 每个 agent:                                          │
│   读 .plan.md → fixture → test RED → implement      │
│   → test GREEN → visual ≥99% → lint → commit        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ Phase 3: /assemble-page                             │
│ (单次会话, 单人)                                      │
│                                                     │
│ 验证所有组件 → E2E test RED → 组装页面 → E2E GREEN   │
│ → lint + typecheck → 更新 registry → commit          │
└─────────────────────────────────────────────────────┘
```

### 为什么拆成三阶段

| 问题 | 旧方案 | 新方案 |
|---|---|---|
| Context window 溢出 | 一次会话承载全部 | 三次独立会话，各自有完整 context |
| 组件间无依赖但串行 | 一个一个做 | Phase 2 并行，多 agent 同时工作 |
| 一个组件失败阻塞全部 | 重来整个流程 | 只重跑失败的那个 agent |
| 设计变更 | 重来整个流程 | 只重跑 `/extract-design-baselines` + 受影响的 agent |
| 长对话中 Claude 跳步 | 全靠规则约束 | 每个 agent 只负责一个组件，工作计划简单明确 |

### Phase 2 的并行能力

`component-builder` agent 在 frontmatter 中设置了 `isolation: worktree`，Claude Code 会自动为每个 agent 创建独立的 git worktree。依赖图由 `/build-components` 解析：

- 无依赖的组件（Atom 层）同时启动
- 有依赖的组件（Molecule 依赖 Atom）等前置组件 merge 后再启动

## 文件结构

```
ui/
├── CLAUDE.md                                         # Claude Code 入口（宪法）
├── AGENTS.md                                         # OpenCode/Codex 入口（CLAUDE.md + rules 内联）
├── Makefile                                          # Codex 质量门禁（替代 hooks）
│
├── .claude/                                          # Claude Code 主要配置（OpenCode 部分兼容）
│   ├── settings.json                                  # Claude Code hooks
│   │
│   ├── rules/                                         # Path-scoped rules（仅 Claude Code 自动加载）
│   │   ├── tdd.md
│   │   ├── component-driven.md
│   │   ├── api-layer.md
│   │   ├── mantine.md
│   │   ├── tanstack-router.md
│   │   ├── tanstack-form.md
│   │   ├── react-i18next.md
│   │   └── console-route-checklist.md
│   │
│   ├── skills/                                        # Skills（Claude Code + OpenCode 共享）
│   │   ├── plan-page/                                 # Phase 1
│   │   ├── build-components/                          # Phase 2
│   │   ├── assemble-page/                             # Phase 3
│   │   ├── extract-design-baselines/                  # Figma → baseline PNG
│   │   ├── figma-visual-convergence/                  # Diff triage → 收敛到 ≤ 0.01
│   │   ├── create-feature/                            # 脚手架
│   │   ├── mantine-api/                               # API 参考
│   │   ├── tanstack-router-api/
│   │   ├── tanstack-form-api/
│   │   └── figma-to-code/
│   │
│   ├── agents/                                        # Claude Code 格式 agents
│   │   ├── component-builder.md                       # isolation: worktree
│   │   ├── ui-reviewer.md
│   │   └── visual-reviewer.md
│   │
│   └── scripts/                                       # 验证脚本（全平台共享）
│       ├── check-component-pair.sh                    # PostToolUse: 文件清单检查（非测试执行）
│       ├── audit-component-tests.sh                   # Stop: 全项目文件清单扫描（非测试执行）
│       ├── enforce-visual-threshold.sh                # Stop: 阈值策略检查（扫描源码，非测试执行）
│       ├── crop-design-reference.sh                   # Mode B: 静态截图裁剪
│       └── validate-baselines.sh                      # baseline PNG 完整性检查
│
└── .opencode/                                        # OpenCode 适配层
    ├── agents/                                        # OpenCode frontmatter 格式的 agents
    │   ├── component-builder.md
    │   └── visual-reviewer.md
    └── plugins/                                       # OpenCode hooks 等价物
        └── quality-gate.ts
│
├── .codex/                                            # Codex 适配层
│   ├── config.toml                                    # multi-agent + skills + fallback 配置
│   └── agents/                                        # Codex TOML agent profiles
│       ├── component-builder.toml
│       ├── visual-reviewer.toml
│       └── explorer.toml
│
└── .agents/                                           # Codex skills 发现目录
    ├── README.md                                      # 设置说明
    └── skills → ../.claude/skills/                    # 符号链接到 .claude/skills/                            # PostToolUse + Stop 逻辑
```
    ├── settings.json                                  # Hook 配置
    │
    ├── rules/                                         # 法律（始终加载）
    │   ├── tdd.md                                     # Red → Green → Refactor + Visual TDD
    │   ├── component-driven.md                        # CDD 层级 + SSOT + fixture 要求
    │   ├── api-layer.md                               # API 抽象层隔离
    │   ├── mantine.md                                 # Mantine 原语优先
    │   ├── tanstack-router.md                         # 路由文件只做适配
    │   ├── tanstack-form.md                           # TanStack Form 唯一
    │   ├── react-i18next.md                           # 零 literal string
    │   └── console-route-checklist.md                 # 合并前检查清单
    │
    ├── skills/                                        # 工具箱（按需加载）
    │   ├── plan-page/                                 # /plan-page — Phase 1: 架构 + 工作计划
    │   │   ├── SKILL.md
    │   │   └── references/
    │   │       └── decomposition-template.md
    │   │
    │   ├── build-components/                          # /build-components — Phase 2: 并行构建
    │   │   └── SKILL.md
    │   │
    │   ├── assemble-page/                             # /assemble-page — Phase 3: 组装 + E2E
    │   │   └── SKILL.md
    │   │
    │   ├── extract-design-baselines/                  # /extract-design-baselines
    │   │   └── SKILL.md
    │   │
    │   ├── create-feature/                            # /create-feature — 脚手架
    │   │   ├── SKILL.md
    │   │   └── scripts/create-feature.sh
    │   │
    │   ├── mantine-api/                               # API 参考
    │   ├── tanstack-router-api/
    │   ├── tanstack-form-api/
    │   └── figma-to-code/
    │
    ├── agents/                                        # 执行者
    │   ├── component-builder.md                       # 组件构建 agent (isolation: worktree)
    │   ├── ui-reviewer.md                             # 代码审查 agent
    │   └── visual-reviewer.md                         # 视觉回归 agent
    │
    └── scripts/                                       # 基础设施脚本
        ├── check-component-pair.sh                    # PostToolUse: 配对文件 + baseline 完整性
        ├── audit-component-tests.sh                   # Stop: 全量审计
        ├── crop-design-reference.sh                   # Mode B: 静态截图裁剪
        └── validate-baselines.sh                      # baseline PNG 完整性验证
```

## Skills 触发方式

| Skill | 触发 | 运行上下文 |
|---|---|---|
| `/plan-page` | 人工 | fork (独立上下文) |
| `/build-components` | 人工 | 当前会话，派发 worktree agents |
| `/assemble-page` | 人工 | fork (独立上下文) |
| `/extract-design-baselines` | 人工或被 /plan-page 调用 | 当前上下文 |
| `/create-feature` | 人工 | 当前上下文 |
| `mantine-api` / `tanstack-*-api` | Claude 自动 | 当前上下文 |

## Agents

| Agent | Isolation | 用途 | 何时运行 |
|---|---|---|---|
| `component-builder` | **worktree** | 构建+测试单个组件 | Phase 2, 并行 |
| `ui-reviewer` | fork | 代码审查 | 按需 |
| `visual-reviewer` | fork | 视觉回归对比 | Phase 2 内或按需 |

## Hooks

三层 hook 检查**文件存在性和代码质量**，不执行测试：

| Hook | 触发 | 做什么 | 不做什么 |
|---|---|---|---|
| PreToolUse (Edit\|Write) | 写 pages/ 文件前 | 注入"检查子组件是否完成"提醒 | 不运行测试 |
| PostToolUse (Edit\|Write) | 写文件后 | ESLint + 文件清单检查 | 不跑 Playwright，不算相似度 |
| Stop | 每轮回答后 | 全量 lint + typecheck + 文件清单扫描 | 不跑单元测试，不跑视觉对比 |

**实际的测试执行**由 agent 工作流或开发者手动完成：
- `pnpm test:unit` — 运行单元测试（Vitest）
- `pnpm exec playwright test` — 运行视觉对比（截图 vs baseline，≥ 99% 像素匹配）

## 日常使用场景

### 场景 1: 开发新页面（完整流程）

```bash
# Session 1: 规划
/plan-page "实现项目仓库列表页" https://www.figma.com/design/ABC/...

# Session 2: 并行构建
/build-components docs/work-plans/plan.md
# → 3 个 agent 在各自 worktree 中并行工作
# → 完成后自动 merge

# Session 3: 组装
/assemble-page docs/work-plans/plan.md
```

### 场景 2: 一个组件视觉回归失败

```bash
# 只重跑失败的组件
/build-components docs/work-plans/plan.md --only RepositoryRow
```

### 场景 3: 设计稿变更

```bash
# 重新提取受影响组件的 baseline
/extract-design-baselines https://www.figma.com/... --only RepositoryRow,RepositoryTable

# 重跑受影响的组件
/build-components docs/work-plans/plan.md --only RepositoryRow,RepositoryTable
```

### 场景 4: 小改动（不走完整流程）

直接改。Rules（TDD、Mantine、CDD）自动生效，Hooks 自动检查。
