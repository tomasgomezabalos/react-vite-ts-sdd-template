// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  githubHeadingSlug,
  parseMarkdown,
} from '../../../tools/quality/markdown.ts'

describe('markdown quality parser', () => {
  it('extracts supported links and ignores code', () => {
    const parsed = parseMarkdown(`# Título útil

[inline](docs/file.md#sección)
[reference][doc]
<https://example.com>
<./local.md>

[doc]: ./reference.md

\`[ignored](missing.md)\`

\`\`\`md
[also ignored](missing.md)
\`\`\`
`)

    expect(parsed.links.map((link) => link.destination)).toEqual([
      'docs/file.md#sección',
      './reference.md',
      'https://example.com',
      './local.md',
    ])
    expect(parsed.anchors).toContain('título-útil')
  })

  it('matches GitHub-like duplicate headings and explicit ids', () => {
    const parsed = parseMarkdown(`# Repetido!
## Repetido!
<a id="manual"></a>
`)

    expect([...parsed.anchors]).toEqual(['repetido', 'repetido-1', 'manual'])
    expect(githubHeadingSlug('Código `npm run check` y acción')).toBe(
      'código-npm-run-check-y-acción',
    )
  })

  it('marks malformed inline and reference destinations as uncheckable', () => {
    const parsed = parseMarkdown('[broken](<missing\n[reference][unknown]\n')

    expect(parsed.links).toHaveLength(2)
    expect(parsed.links.every((link) => link.destination === undefined)).toBe(
      true,
    )
  })
})
