// @vitest-environment node

import { spawnSync } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertProjectContext,
  ProjectError,
  resolveSafePath,
} from '../../../tools/template/project.ts'
import { hashText } from '../../../tools/template/config.ts'
import { createProjectFixture } from './helpers/project-fixture.ts'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

describe('project safety', () => {
  it('rejects traversal and symbolic managed paths', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const outside = await mkdtemp(join(tmpdir(), 'template-outside-'))
    cleanups.push(() => rm(outside, { recursive: true, force: true }))
    await writeFile(resolve(outside, 'value.txt'), 'outside')
    await symlink(
      resolve(outside, 'value.txt'),
      resolve(fixture.target, 'linked.txt'),
    )

    await expect(
      resolveSafePath(fixture.target, '../outside.txt'),
    ).rejects.toThrow(ProjectError)
    await expect(resolveSafePath(fixture.target, 'linked.txt')).rejects.toThrow(
      /simbólic/,
    )
  })

  it('rejects the canonical source remote', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    expect(spawnSync('git', ['-C', fixture.target, 'init']).status).toBe(0)
    expect(
      spawnSync('git', [
        '-C',
        fixture.target,
        'remote',
        'add',
        'origin',
        manifest.canonicalRemote,
      ]).status,
    ).toBe(0)

    await expect(
      assertProjectContext(fixture.target, fixture.config, manifest),
    ).rejects.toThrow(/remoto canónico/)
  })

  it.each([
    ['another remote name', ['remote', 'add', 'upstream']],
    ['a push URL', ['remote', 'set-url', '--push', 'origin']],
  ])('rejects the canonical source remote through %s', async (_name, args) => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    const git = (...parameters: string[]) =>
      spawnSync('git', ['-C', fixture.target, ...parameters]).status
    expect(git('init')).toBe(0)
    expect(
      git('remote', 'add', 'origin', 'https://example.com/other/app.git'),
    ).toBe(0)
    expect(git(...args, manifest.canonicalRemote)).toBe(0)

    await expect(
      assertProjectContext(fixture.target, fixture.config, manifest),
    ).rejects.toThrow(/remoto canónico.*(upstream|origin)/)
  })

  it('accepts foreign remotes only', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const git = (...parameters: string[]) =>
      spawnSync('git', ['-C', fixture.target, ...parameters]).status
    expect(git('init')).toBe(0)
    expect(
      git('remote', 'add', 'origin', 'https://example.com/a/app.git'),
    ).toBe(0)
    expect(git('remote', 'add', 'upstream', 'git@example.com:b/app.git')).toBe(
      0,
    )

    await expect(
      assertProjectContext(fixture.target, fixture.config, fixture.manifest),
    ).resolves.toBeUndefined()
  })

  it('accepts a matching baseline without requiring a remote or declared evidence', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)

    await expect(
      assertProjectContext(fixture.target, fixture.config, fixture.manifest),
    ).resolves.toBeUndefined()
  })

  it.each([
    ['tools/template/init.ts', 'tools/template'],
    ['tests/tools/template/cli.test.ts', 'tests/tools/template'],
    ['project.config.json', 'project.config.json'],
    ['.template-state.json', '.template-state.json'],
    ['.claude/settings.local.json', '.claude/settings.local.json'],
    ['docs/superpowers/plans/plan.md', 'docs/superpowers'],
    [
      '.github/workflows/template-tools.yml',
      '.github/workflows/template-tools.yml',
    ],
  ])(
    'rejects a target that contains the excluded path %s',
    async (file, reported) => {
      const fixture = await createProjectFixture()
      cleanups.push(fixture.cleanup)
      await mkdir(resolve(fixture.target, file, '..'), { recursive: true })
      await writeFile(resolve(fixture.target, file), 'x')

      await expect(
        assertProjectContext(fixture.target, fixture.config, fixture.manifest),
      ).rejects.toThrow(
        new RegExp(`derivation\\.exclude.*${reported.replaceAll('.', '\\.')}`),
      )
    },
  )

  it('rejects a baseline without the inherited quality command', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    const packagePath = resolve(fixture.target, 'package.json')
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as {
      scripts: Record<string, string>
    }
    delete packageJson.scripts.check
    const content = `${JSON.stringify(packageJson, null, 2)}\n`
    await writeFile(packagePath, content)
    manifest.managedFiles['package.json'] = hashText(content)

    await expect(
      assertProjectContext(fixture.target, fixture.config, manifest),
    ).rejects.toThrow(/npm run check/)
  })
})
