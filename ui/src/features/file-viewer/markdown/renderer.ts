import DOMPurify from 'dompurify'
import MarkdownItAsync from 'markdown-it-async'
import MarkdownItGitHubAlerts from 'markdown-it-github-alerts'

import type { HighlighterCore } from 'shiki/core'

type Renderer = ReturnType<typeof MarkdownItAsync>

/**
 * Grammar loaders keyed by fence language. Loaded lazily by the async
 * highlight callback — only grammars actually used by the document being
 * rendered are fetched (cpp alone is ~800 kB).
 */
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  bash: () => import('@shikijs/langs/bash'),
  shell: () => import('@shikijs/langs/shell'),
  python: () => import('@shikijs/langs/python'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  markdown: () => import('@shikijs/langs/markdown'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  java: () => import('@shikijs/langs/java'),
  sql: () => import('@shikijs/langs/sql'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  diff: () => import('@shikijs/langs/diff'),
  docker: () => import('@shikijs/langs/docker'),
  toml: () => import('@shikijs/langs/toml'),
  ini: () => import('@shikijs/langs/ini'),
}

/** Map fence aliases to the canonical grammar name Shiki registers. */
const LANG_ALIASES: Record<string, string> = {
  'c++': 'cpp',
  sh: 'bash',
  zsh: 'bash',
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
  md: 'markdown',
  dockerfile: 'docker',
}

let highlighterPromise: Promise<HighlighterCore> | null = null
let rendererPromise: Promise<Renderer> | null = null

/** A YAML mapping entry (`key: value`), sequence item, comment, or indented continuation. */
const YAML_LINE = /^(?:[\w.-]+\s*:(?:\s.*)?|-\s.*|\s+\S.*|#\s.*)?$/

/**
 * Strip a leading YAML frontmatter block (as found in Hugging Face model
 * READMEs). Only strips when the block looks like a YAML mapping, so a
 * document that merely opens with a `---` thematic break is left intact.
 */
export function stripFrontmatter(content: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content)

  if (!match) {
    return content
  }

  const lines = match[1].split(/\r?\n/)
  const startsWithKey = /^[\w.-]+\s*:/.test(lines[0] ?? '')

  return startsWithKey && lines.every(line => YAML_LINE.test(line))
    ? content.slice(match[0].length)
    : content
}

/**
 * Sanitizer for untrusted README HTML. Beyond DOMPurify's script-stripping
 * defaults we drop `<style>` and form controls, and only keep inline `style`
 * when it is purely token colouring (what Shiki emits) so repository content
 * cannot restyle or overlay the surrounding UI.
 */
const purifier = DOMPurify()

purifier.setConfig({
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option', 'label', 'fieldset'],
  ADD_ATTR: ['target'],
})

const COLOR_VALUE = /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|inherit|transparent)$/i
const COLOR_PROPERTY = /^(?:color|background-color|--shiki-(?:dark|light)(?:-bg)?)$/

function isColorOnlyStyle(style: string): boolean {
  return style
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .every((declaration) => {
      const [property, ...rest] = declaration.split(':')
      const value = rest.join(':').trim()

      return COLOR_PROPERTY.test(property.trim()) && COLOR_VALUE.test(value)
    })
}

purifier.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style' && !isColorOnlyStyle(data.attrValue)) {
    data.keepAttr = false
  }
})

// Every external link — markdown-generated or raw HTML — opens in a new tab.
purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') {
    return
  }

  const href = node.getAttribute('href') ?? ''

  if (href.startsWith('#')) {
    node.removeAttribute('target')

    return
  }

  node.setAttribute('target', '_blank')
  node.setAttribute('rel', 'noopener noreferrer')
})

async function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])

    return createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark'),
      ],
      langs: [],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    })
  })()

  return highlighterPromise
}

/** Resolve a fence language to a loaded grammar, fetching it on demand. */
async function resolveLang(highlighter: HighlighterCore, lang: string): Promise<string> {
  const canonical = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()

  if (highlighter.getLoadedLanguages().includes(canonical)) {
    return canonical
  }

  const loader = LANG_LOADERS[canonical]

  if (!loader) {
    return 'text'
  }

  const mod = await loader() as { default: Parameters<HighlighterCore['loadLanguage']>[0] }

  await highlighter.loadLanguage(mod.default)

  return canonical
}

function createRenderer(): Renderer {
  const md = MarkdownItAsync({
    html: true,
    linkify: true,
    warnOnSyncRender: true,
    highlight: async (code, lang) => {
      const highlighter = await getHighlighter()
      const language = await resolveLang(highlighter, lang)

      return highlighter.codeToHtml(code, {
        lang: language,
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        defaultColor: 'light',
      })
    },
  })

  md.use(MarkdownItGitHubAlerts)

  return md
}

/** Render markdown to sanitized HTML (GitHub-flavored: alerts, autolinks, Shiki-highlighted code). */
export async function renderMarkdown(content: string): Promise<string> {
  rendererPromise ??= Promise.resolve(createRenderer())
  const md = await rendererPromise
  const html = await md.renderAsync(stripFrontmatter(content))

  return purifier.sanitize(html)
}
