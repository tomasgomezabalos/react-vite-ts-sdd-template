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

  it('records the delivery of a QUICK change in its own record, without a trivial test', async () => {
    const documents = {
      workflow: await read('docs/sdd/workflow.md'),
      policy: await read('docs/sdd/change-policy.md'),
      template: await read('docs/sdd/templates/quick-change.md'),
      agents: await read('AGENTS.md'),
    }

    for (const [name, content] of Object.entries(documents)) {
      expect(content, name).not.toMatch(/trivial/i)
    }
    for (const name of ['workflow', 'policy', 'agents'] as const) {
      expect(documents[name], name).toContain(
        'sección de entrega del propio `quick-change.md`',
      )
    }
    expect(documents.template).toContain('validation-report.md')
  })

  it('versions the workflow and the change policy after ADR-0018', async () => {
    for (const path of ['docs/sdd/workflow.md', 'docs/sdd/change-policy.md']) {
      const content = await read(path)

      expect(content, path).toMatch(/\*\*Versión:\*\* 2\.1\.0/)
      expect(content, path).toContain('ADR-0018')
    }
    expect(await read('docs/sdd/README.md')).not.toContain(
      '`APPROVED 2.0.0` | Estados',
    )
  })
})
