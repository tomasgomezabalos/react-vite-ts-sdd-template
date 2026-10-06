// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
const skillName = 'sdd-react-ts-feature-pattern'
const skillPath = `.claude/skills/${skillName}/SKILL.md`

const read = (path: string) => readFile(resolve(repositoryRoot, path), 'utf8')

describe(`project skill ${skillName}`, () => {
  it('identifies itself as the project copy that applies ADR-0021', async () => {
    const skill = await read(skillPath)

    expect(skill).toContain('## Project skill (source of truth)')
    expect(skill).toContain('Red-Green-Refactor')
    expect(skill).toContain('ADR-0021')
  })

  it('has a project-specific name and does not claim to outrank same-name copies', async () => {
    const skill = await read(skillPath)

    expect(skill).toContain(`name: ${skillName}`)
    expect(skill).toContain('personal')
    expect(skill).not.toContain('this one prevails')
    await expect(
      readFile(
        resolve(
          repositoryRoot,
          '.claude/skills/react-ts-feature-pattern/SKILL.md',
        ),
        'utf8',
      ),
    ).rejects.toThrow()
  })

  it('is the copy that AGENTS.md tells agents to load, also in a derivation', async () => {
    const agents = await read('AGENTS.md')
    const derived = agents.replace(
      /<!-- template-only:start -->[\s\S]*?<!-- template-only:end -->\n/g,
      '',
    )

    expect(derived).toContain(`\`${skillPath}\``)
    expect(derived).toContain('Project skill (source of truth)')
  })
})
