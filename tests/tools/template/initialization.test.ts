// @vitest-environment node

import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { hashText } from '../../../tools/template/config.ts'
import { buildPreview } from '../../../tools/template/managed-files.ts'
import { readProjectFile } from '../../../tools/template/project.ts'
import {
  applyPreview,
  hasTransaction,
  recoverTransaction,
} from '../../../tools/template/transaction.ts'
import type { TransactionJournal } from '../../../tools/template/types.ts'
import {
  createProjectFixture,
  snapshotProject,
} from './helpers/project-fixture.ts'

const cleanups: Array<() => Promise<void>> = []
const integrationTestTimeout = 30_000

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

const stableSnapshot = (
  snapshot: Awaited<ReturnType<typeof snapshotProject>>,
) =>
  Object.fromEntries(
    Object.entries(snapshot).map(([path, value]) => [
      path,
      { hash: value.hash, mode: value.mode },
    ]),
  )

describe('project initialization', () => {
  it(
    'previews deterministically without modifying the project',
    async () => {
      const fixture = await createProjectFixture()
      cleanups.push(fixture.cleanup)
      const manifest = fixture.manifest
      expect(spawnSync('git', ['-C', fixture.target, 'init']).status).toBe(0)
      const before = await snapshotProject(fixture.target)
      const gitBefore = spawnSync(
        'git',
        ['-C', fixture.target, 'status', '--porcelain=v1'],
        { encoding: 'utf8' },
      ).stdout

      const first = await buildPreview(fixture.target, fixture.config, manifest)
      const second = await buildPreview(
        fixture.target,
        fixture.config,
        manifest,
      )

      expect(first.token).toBe(second.token)
      expect(
        first.operations.some((operation) => operation.kind !== 'unchanged'),
      ).toBe(true)
      expect(await snapshotProject(fixture.target)).toEqual(before)
      expect(
        spawnSync('git', ['-C', fixture.target, 'status', '--porcelain=v1'], {
          encoding: 'utf8',
        }).stdout,
      ).toBe(gitBefore)
    },
    integrationTestTimeout,
  )

  it('binds the token to the configuration', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    const first = await buildPreview(fixture.target, fixture.config, manifest)
    const changedConfig = structuredClone(fixture.config)
    changedConfig.identity.displayName = 'Another Example'

    const second = await buildPreview(fixture.target, changedConfig, manifest)

    expect(second.token).not.toBe(first.token)
  })

  it(
    'applies all outputs and becomes an idempotent no-op',
    async () => {
      const fixture = await createProjectFixture()
      cleanups.push(fixture.cleanup)
      const manifest = fixture.manifest
      const preview = await buildPreview(
        fixture.target,
        fixture.config,
        manifest,
      )

      const first = await applyPreview(preview)
      const packageJson = JSON.parse(
        await readFile(resolve(fixture.target, 'package.json'), 'utf8'),
      ) as {
        name: string
        version: string
      }
      expect(first.changed).toBeGreaterThan(0)
      expect(packageJson).toMatchObject({
        name: 'example-project',
        version: '0.1.0',
      })
      expect(
        await readProjectFile(fixture.target, '.template-state.json'),
      ).toBeNull()
      expect(preview.operations.map(({ path }) => path).sort()).toEqual([
        'AGENTS.md',
        'README.md',
        'index.html',
        'package-lock.json',
        'package.json',
      ])
      const outputs = {
        agents: await readFile(resolve(fixture.target, 'AGENTS.md'), 'utf8'),
        readme: await readFile(resolve(fixture.target, 'README.md'), 'utf8'),
        scripts: (
          JSON.parse(
            await readFile(resolve(fixture.target, 'package.json'), 'utf8'),
          ) as {
            scripts: Record<string, string>
          }
        ).scripts,
      }
      expect(outputs.agents).not.toContain('template-only')
      expect(outputs.agents).not.toContain('template:init')
      expect(outputs.agents).toContain('ADR-0010 y ADR-0012')
      expect(outputs.agents).toContain('docs/platform/')
      expect(outputs.readme).not.toContain('template:')
      expect(outputs.scripts).not.toHaveProperty('template:init')
      expect(outputs.scripts).not.toHaveProperty('template:doctor')
      expect(outputs.scripts).toHaveProperty('check')
      expect(outputs.scripts).toHaveProperty('test:tools')
      expect(await readProjectFile(fixture.target, '.env.example')).toBeNull()
      expect(
        await readProjectFile(fixture.target, 'specs/product-vision.md'),
      ).toBeNull()

      const repeatedPreview = await buildPreview(
        fixture.target,
        fixture.config,
        manifest,
      )
      expect(
        repeatedPreview.operations.every(
          (operation) => operation.kind === 'unchanged',
        ),
      ).toBe(true)
      await expect(applyPreview(repeatedPreview)).resolves.toEqual({
        transactionId: null,
        changed: 0,
      })

      const changedConfig = structuredClone(fixture.config)
      changedConfig.identity.displayName = 'Different Project'
      await expect(
        buildPreview(fixture.target, changedConfig, manifest),
      ).rejects.toThrow(/contenido no reconocido/)
    },
    integrationTestTimeout,
  )

  it('rejects unknown changes before writing', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    await writeFile(resolve(fixture.target, 'README.md'), 'User content\n')

    await expect(
      buildPreview(fixture.target, fixture.config, manifest),
    ).rejects.toThrow(/contenido no reconocido/)
  })

  it('rejects a preview when any managed file changes before apply', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    const preview = await buildPreview(fixture.target, fixture.config, manifest)
    await writeFile(
      resolve(fixture.target, 'README.md'),
      'Changed after preview\n',
    )

    await expect(applyPreview(preview)).rejects.toThrow(
      /cambió después del preview/,
    )
    expect(await readProjectFile(fixture.target, 'AGENTS.md')).toMatchObject({
      hash: fixture.manifest.managedFiles['AGENTS.md'],
    })
  })

  it('rolls back a controlled failure without leaving a transaction', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    const before = stableSnapshot(await snapshotProject(fixture.target))
    const rollbackConfig = structuredClone(fixture.config)
    rollbackConfig.identity.displayName = 'Rollback Example'
    rollbackConfig.identity.packageName = 'rollback-example'
    const preview = await buildPreview(fixture.target, rollbackConfig, manifest)

    await expect(applyPreview(preview, { failAfter: 2 })).rejects.toThrow(
      /se revirtió/,
    )

    expect(stableSnapshot(await snapshotProject(fixture.target))).toEqual(
      before,
    )
  })

  it.each(['interrupted', 'already restored', 'modified by user'] as const)(
    'recovers safely when the file is %s',
    async (fileState) => {
      const fixture = await createProjectFixture()
      cleanups.push(fixture.cleanup)
      const id = randomUUID()
      const originalPath = resolve(fixture.target, 'README.md')
      const original = await readFile(originalPath, 'utf8')
      const originalMode = (await stat(originalPath)).mode & 0o777
      const changed = 'Interrupted output\n'
      const root = resolve(fixture.target, '.template-transaction', id)
      const backup = resolve(root, 'backup/README.md')
      await mkdir(dirname(backup), { recursive: true })
      await writeFile(backup, original)
      await writeFile(originalPath, changed)
      const journal: TransactionJournal = {
        schemaVersion: 1,
        id,
        target: fixture.target,
        status: 'applying',
        operations: [
          {
            path: 'README.md',
            kind: 'modify',
            beforeHash: hashText(original),
            afterHash: hashText(changed),
            mode: originalMode,
            backupPath: 'backup/README.md',
            applied: false,
          },
        ],
      }
      await writeFile(
        resolve(root, 'journal.json'),
        `${JSON.stringify(journal, null, 2)}\n`,
      )

      if (fileState === 'already restored')
        await writeFile(originalPath, original)
      if (fileState === 'modified by user')
        await writeFile(originalPath, 'User changes\n')

      expect(await hasTransaction(fixture.target, id)).toBe(true)
      if (fileState === 'modified by user') {
        await expect(recoverTransaction(fixture.target, id)).rejects.toThrow(
          /cambió después de la transacción/,
        )
        expect(await readFile(originalPath, 'utf8')).toBe('User changes\n')
        expect(await readFile(backup, 'utf8')).toBe(original)
        expect(await hasTransaction(fixture.target, id)).toBe(true)
        return
      }
      await recoverTransaction(fixture.target, id)

      expect(await readFile(originalPath, 'utf8')).toBe(original)
      expect((await stat(originalPath)).mode & 0o777).toBe(originalMode)
      expect(await hasTransaction(fixture.target, id)).toBe(false)
    },
  )
})
