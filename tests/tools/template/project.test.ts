// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertProjectContext,
  ProjectError,
  resolveSafePath,
} from '../../../tools/template/project.ts'
import {
  createProjectFixture,
} from './helpers/project-fixture.ts'

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
    await symlink(resolve(outside, 'value.txt'), resolve(fixture.target, 'linked.txt'))

    await expect(resolveSafePath(fixture.target, '../outside.txt')).rejects.toThrow(ProjectError)
    await expect(resolveSafePath(fixture.target, 'linked.txt')).rejects.toThrow(/simbólic/)
  })

  it('rejects the canonical source remote', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    expect(spawnSync('git', ['-C', fixture.target, 'init']).status).toBe(0)
    expect(spawnSync('git', [
      '-C',
      fixture.target,
      'remote',
      'add',
      'origin',
      manifest.canonicalRemote,
    ]).status).toBe(0)

    await expect(assertProjectContext(fixture.target, fixture.config, manifest))
      .rejects.toThrow(/remoto canónico/)
  })

  it('rejects quality commands that are not declared npm scripts', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    fixture.config.quality.commands.push('npm run missing-command')

    await expect(assertProjectContext(fixture.target, fixture.config, manifest))
      .rejects.toThrow(/missing-command/)
  })
})
