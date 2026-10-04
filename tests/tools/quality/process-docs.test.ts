// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../../..')

const read = (path: string) => readFile(resolve(repositoryRoot, path), 'utf8')

describe('process documents', () => {
  it('asks the technical plan for strict mode and the accessibility assertion', async () => {
    const template = await read('docs/sdd/templates/technical-plan.md')

    expect(template).toContain(
      '`strict` para componentes nuevos o con cambios de comportamiento observable',
    )
    expect(template).toContain('expectNoAccessibilityViolations')
  })

  it('tells agents how to apply the format that the gate verifies', async () => {
    const agents = await read('AGENTS.md')
    const derived = agents.replace(
      /<!-- template-only:start -->[\s\S]*?<!-- template-only:end -->\n/g,
      '',
    )
    const packageJson = JSON.parse(await read('package.json')) as {
      scripts: Record<string, string>
    }

    expect(derived).toContain('`npm run format`')
    expect(derived).toContain('`format:check`')
    expect(Object.keys(packageJson.scripts)).toEqual(
      expect.arrayContaining(['format', 'format:check']),
    )
  })
})
