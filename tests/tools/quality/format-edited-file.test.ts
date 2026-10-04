// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { symlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { formatEditedFile } from '../../../tools/quality/format-edited-file.ts'
import { createQualityFixture } from './helpers/quality-fixture.ts'
import type { QualityFixture } from './helpers/quality-fixture.ts'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
const scriptPath = resolve(
  repositoryRoot,
  'tools/quality/format-edited-file.ts',
)
const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

const messy = 'const  value = "a" ;\n'
const formatted = "const value = 'a'\n"

const createProject = async (): Promise<QualityFixture> => {
  const fixture = await createQualityFixture()
  cleanups.push(fixture.cleanup)
  await symlink(
    resolve(repositoryRoot, 'node_modules'),
    resolve(fixture.root, 'node_modules'),
  )
  await fixture.write(
    '.prettierrc.json',
    '{"semi": false, "singleQuote": true}',
  )
  await fixture.write('.prettierignore', 'ignored/\n')
  return fixture
}

const hookInput = (filePath: unknown): string =>
  JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: filePath } })

describe('settings.json shared by Claude Code', () => {
  it('declares the approved permission rules and the formatting hook', async () => {
    const settings = JSON.parse(
      await readFile(resolve(repositoryRoot, '.claude/settings.json'), 'utf8'),
    ) as {
      $schema: string
      permissions: { allow: string[]; ask: string[]; deny: string[] }
      hooks: {
        PostToolUse: Array<{
          matcher: string
          hooks: Array<{ type: string; command: string }>
        }>
      }
    }

    expect(settings.$schema).toBe(
      'https://json.schemastore.org/claude-code-settings.json',
    )
    expect(settings.permissions).toEqual({
      allow: [
        'Bash(npm run check)',
        'Bash(npm run lint)',
        'Bash(npm run format)',
        'Bash(npm run format:check)',
        'Bash(npm run docs:check)',
        'Bash(npm run architecture:check)',
        'Bash(npm run test)',
        'Bash(npm run test:coverage)',
        'Bash(npm run build)',
      ],
      ask: ['Bash(git commit *)', 'Bash(git push *)'],
      deny: ['Bash(npm publish *)', 'Read(./.env)', 'Read(./.env.*)'],
    })
    expect(settings.hooks.PostToolUse).toHaveLength(1)
    expect(settings.hooks.PostToolUse[0]?.matcher).toBe('Edit|Write|MultiEdit')
    expect(settings.hooks.PostToolUse[0]?.hooks).toEqual([
      {
        type: 'command',
        command:
          'node "${CLAUDE_PROJECT_DIR}/tools/quality/format-edited-file.ts"',
      },
    ])
  })
})

describe('format-edited-file hook', () => {
  it('formats only the edited file with a supported extension', async () => {
    const project = await createProject()
    await project.write('src/a.ts', messy)
    await project.write('src/other.ts', messy)

    const result = formatEditedFile(
      hookInput(resolve(project.root, 'src/a.ts')),
      project.root,
    )

    expect(result).toEqual({ code: 0 })
    expect(await project.read('src/a.ts')).toBe(formatted)
    expect(await project.read('src/other.ts')).toBe(messy)
  })

  it('does not touch unsupported extensions or ignored files', async () => {
    const project = await createProject()
    await project.write('notes.md', '#  Title\n')
    await project.write('ignored/a.ts', messy)

    for (const path of ['notes.md', 'ignored/a.ts']) {
      expect(
        formatEditedFile(hookInput(resolve(project.root, path)), project.root),
      ).toEqual({ code: 0 })
    }
    expect(await project.read('notes.md')).toBe('#  Title\n')
    expect(await project.read('ignored/a.ts')).toBe(messy)
  })

  it('ignores invalid input without writing anything', async () => {
    const project = await createProject()
    const outside = await createQualityFixture()
    cleanups.push(outside.cleanup)
    await outside.write('a.ts', messy)
    await project.write('src/a.ts', messy)

    const inputs = [
      '{not json',
      '{}',
      hookInput(42),
      hookInput(resolve(outside.root, 'a.ts')),
      hookInput(resolve(project.root, 'src/missing.ts')),
    ]
    for (const input of inputs) {
      expect(formatEditedFile(input, project.root)).toEqual({ code: 0 })
    }
    expect(await outside.read('a.ts')).toBe(messy)
    expect(await project.read('src/a.ts')).toBe(messy)
  })

  it('exits successfully when Prettier is not installed', async () => {
    const project = await createQualityFixture()
    cleanups.push(project.cleanup)
    await project.write('src/a.ts', messy)

    expect(
      formatEditedFile(
        hookInput(resolve(project.root, 'src/a.ts')),
        project.root,
      ),
    ).toEqual({ code: 0 })
    expect(await project.read('src/a.ts')).toBe(messy)
  })

  it('reports a syntax error with exit code 2 and the diagnostic', async () => {
    const project = await createProject()
    await project.write('src/broken.ts', 'const = ;\n')

    const result = formatEditedFile(
      hookInput(resolve(project.root, 'src/broken.ts')),
      project.root,
    )

    expect(result.code).toBe(2)
    expect(result.stderr).toContain('broken.ts')
  })

  it('works as a command reading the hook JSON from stdin', async () => {
    const project = await createProject()
    await project.write('src/a.ts', messy)

    const run = spawnSync(process.execPath, [scriptPath], {
      input: hookInput(resolve(project.root, 'src/a.ts')),
      env: { ...process.env, CLAUDE_PROJECT_DIR: project.root },
      encoding: 'utf8',
    })

    expect(run.status).toBe(0)
    expect(await project.read('src/a.ts')).toBe(formatted)
  })
})
