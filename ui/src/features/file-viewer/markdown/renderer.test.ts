import {
  describe, expect, it,
} from 'vitest'

import { renderMarkdown, stripFrontmatter } from './renderer'

describe('stripFrontmatter', () => {
  it('strips a leading YAML mapping block', () => {
    const input = '---\nlicense: apache-2.0\nbase_model:\n- Qwen/Qwen3-0.6B-Base\n---\n# Title\n'

    expect(stripFrontmatter(input)).toBe('# Title\n')
  })

  it('keeps a document that opens with a thematic break', () => {
    const input = '---\n# Introduction\nSome text.\n---\n# Details\n'

    expect(stripFrontmatter(input)).toBe(input)
  })

  it('leaves content without frontmatter untouched', () => {
    expect(stripFrontmatter('# Title\n')).toBe('# Title\n')
  })
})

describe('renderMarkdown', () => {
  it('opens markdown links in a new tab', async () => {
    const html = await renderMarkdown('[blog](https://example.com)')

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('opens raw HTML anchors in a new tab', async () => {
    const html = await renderMarkdown('<a href="https://example.com"><img src="badge.svg"></a>')

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('does not force in-page anchors into a new tab', async () => {
    const html = await renderMarkdown('[Best Practices](#best-practices)')

    expect(html).not.toContain('target=')
  })

  it('drops style blocks and non-colour inline styles from raw HTML', async () => {
    const html = await renderMarkdown(
      '<style>body{display:none}</style>\n<div style="position:fixed;top:0;color:red">overlay</div>',
    )

    expect(html).not.toContain('<style')
    expect(html).not.toContain('position')
    expect(html).toContain('overlay')
  })

  it('drops form controls from raw HTML', async () => {
    const html = await renderMarkdown('<form><input name="x"><button>go</button></form>')

    expect(html).not.toMatch(/<(form|input|button)/)
  })

  it('keeps Shiki token colours', async () => {
    const html = await renderMarkdown('```python\nx = 1\n```')

    expect(html).toContain('class="shiki')
    expect(html).toMatch(/style="color:#[0-9a-f]{6}/i)
  })

  it('renders GitHub alerts', async () => {
    const html = await renderMarkdown('> [!TIP]\n> Use it.')

    expect(html).toContain('markdown-alert-tip')
  })
})
