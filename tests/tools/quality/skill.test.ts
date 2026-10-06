// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
const skillDirectory = '.claude/skills/sdd-react-ts-feature-pattern'

const read = (path: string) => readFile(resolve(repositoryRoot, path), 'utf8')

describe('sdd-react-ts-feature-pattern skill', () => {
  it('uses strict by default for new components, as AGENTS.md requires', async () => {
    const skill = await read(`${skillDirectory}/SKILL.md`)
    const agents = await read('AGENTS.md')

    expect(skill).toContain('Project overrides')
    expect(skill).toContain('`strict` when creating a component')
    expect(agents).toContain(
      'Para componentes nuevos o con cambios de comportamiento observable usar el modo `strict`',
    )
  })

  it('asks for the accessibility assertion of the project in strict mode', async () => {
    const skill = await read(`${skillDirectory}/SKILL.md`)

    expect(skill).toContain('expectNoAccessibilityViolations')
    expect(skill).toContain('tests/setup/axe.ts')
  })

  it('states the real worker location, placement rules and style convention', async () => {
    const skill = await read(`${skillDirectory}/SKILL.md`)

    expect(skill).toContain('msw.workerDirectory')
    expect(skill).toContain('mocks/public')
    expect(skill).not.toContain('`public/mockServiceWorker.js`')
    expect(skill).toContain('architecture:check')
    for (const folder of ['components', 'hooks', 'services', 'slices']) {
      expect(skill).toContain(`src/${folder}/`)
    }
    expect(skill).toContain('styles.module.scss')
    expect(skill).not.toContain('`ComponentName/styles.scss`')
  })

  it('keeps no examples or wording from another product', async () => {
    for (const path of [
      `${skillDirectory}/SKILL.md`,
      `${skillDirectory}/references/sonar-local-rules.md`,
    ]) {
      expect(await read(path), path).not.toMatch(
        /WeatherCard|weather|forecast|map interactions|map behavior/i,
      )
    }
  })

  it('reads the Sonar overlay only when the user provides findings', async () => {
    const skill = await read(`${skillDirectory}/SKILL.md`)

    expect(skill).toContain(
      'only when the user provides Sonar or SonarLint findings',
    )
    expect(skill).not.toContain(
      'read `references/sonar-local-rules.md` when it exists',
    )
  })
})
