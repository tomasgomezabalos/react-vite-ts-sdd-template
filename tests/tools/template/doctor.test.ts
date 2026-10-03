// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  runDiagnostics,
  satisfiesNodeRange,
} from '../../../tools/template/diagnostics.ts'
import { buildPreview } from '../../../tools/template/managed-files.ts'
import { applyPreview } from '../../../tools/template/transaction.ts'
import {
  createProjectFixture,
  snapshotProject,
} from './helpers/project-fixture.ts'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

describe('template doctor', () => {
  it('checks both bounds of the supported Node range', () => {
    expect(satisfiesNodeRange('v22.23.2', '>=22.23.2 <23')).toBe(true)
    expect(satisfiesNodeRange('22.99.0', '>=22.23.2 <23')).toBe(true)
    expect(satisfiesNodeRange('22.23.1', '>=22.23.2 <23')).toBe(false)
    expect(satisfiesNodeRange('23.0.0', '>=22.23.2 <23')).toBe(false)
    expect(satisfiesNodeRange('invalid', '>=22.23.2 <23')).toBe(false)
    expect(satisfiesNodeRange('22.23.2', 'unsupported')).toBe(false)
  })

  it('passes the HTML and managed output checks for a name with replacement patterns', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const config = {
      ...fixture.config,
      identity: { ...fixture.config.identity, displayName: 'Cash $& Co' },
    }
    await applyPreview(
      await buildPreview(fixture.target, config, fixture.manifest),
    )

    const diagnostics = await runDiagnostics(
      fixture.target,
      config,
      fixture.manifest,
    )

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'HTML_IDENTITY', status: 'PASS' }),
    )
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'MANAGED_OUTPUTS', status: 'PASS' }),
    )
  })

  it('diagnoses an initialized fixture without modifying it', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    await applyPreview(
      await buildPreview(fixture.target, fixture.config, manifest),
    )
    expect(spawnSync('git', ['-C', fixture.target, 'init']).status).toBe(0)
    const before = await snapshotProject(fixture.target)
    const gitBefore = spawnSync(
      'git',
      ['-C', fixture.target, 'status', '--porcelain=v1'],
      { encoding: 'utf8' },
    ).stdout

    const diagnostics = await runDiagnostics(
      fixture.target,
      fixture.config,
      manifest,
    )

    expect(diagnostics.some((diagnostic) => diagnostic.status === 'FAIL')).toBe(
      false,
    )
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'MANAGED_OUTPUTS',
        status: 'PASS',
      }),
    )
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === 'INITIALIZATION_STATE',
      ),
    ).toBe(false)
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'PRODUCT_VISION'),
    ).toBe(false)
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === 'DEPLOYMENT_DECISIONS',
      ),
    ).toBe(false)
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'PENDING_DECISION'),
    ).toBe(false)
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === 'PUBLIC_ENVIRONMENT',
      ),
    ).toBe(false)
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'SOURCE_REMOTE',
        status: 'UNKNOWN',
      }),
    )
    expect(await snapshotProject(fixture.target)).toEqual(before)
    expect(
      spawnSync('git', ['-C', fixture.target, 'status', '--porcelain=v1'], {
        encoding: 'utf8',
      }).stdout,
    ).toBe(gitBefore)
  })

  const initialized = async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    await applyPreview(
      await buildPreview(fixture.target, fixture.config, fixture.manifest),
    )
    return fixture
  }
  const diagnose = async (
    fixture: Awaited<ReturnType<typeof initialized>>,
    code: string,
  ) =>
    (
      await runDiagnostics(fixture.target, fixture.config, fixture.manifest)
    ).find((entry) => entry.code === code)

  it.each([
    [
      'comments, blank lines and valid names',
      '# Variables públicas\n# secret token\n\nVITE_API_URL=http://x\n',
      'PASS',
    ],
    ['a sensitive name', 'VITE_API_TOKEN=x\n', 'FAIL'],
    ['a name without the public prefix', 'API_URL=x\n', 'FAIL'],
  ])('checks .env.example with %s', async (_name, content, status) => {
    const fixture = await initialized()
    await writeFile(resolve(fixture.target, '.env.example'), content)

    expect(await diagnose(fixture, 'PUBLIC_ENVIRONMENT')).toMatchObject({
      status,
    })
  })

  it.each([
    ['canonical under another remote name', ['upstream', 'canonical'], 'FAIL'],
    ['only foreign remotes', ['upstream', 'foreign'], 'PASS'],
  ])('reports SOURCE_REMOTE with %s', async (_name, [name, kind], status) => {
    const fixture = await initialized()
    const git = (...parameters: string[]) =>
      spawnSync('git', ['-C', fixture.target, ...parameters]).status
    expect(git('init')).toBe(0)
    expect(
      git('remote', 'add', 'origin', 'https://example.com/other/app.git'),
    ).toBe(0)
    const url =
      kind === 'canonical'
        ? fixture.manifest.canonicalRemote
        : 'https://example.com/another/app.git'
    expect(git('remote', 'add', name as string, url)).toBe(0)

    expect(await diagnose(fixture, 'SOURCE_REMOTE')).toMatchObject({ status })
  })

  it('fails managed outputs when a derived file diverges from the configuration', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    await applyPreview(
      await buildPreview(fixture.target, fixture.config, manifest),
    )
    const agents = resolve(fixture.target, 'AGENTS.md')
    await writeFile(
      agents,
      `${await readFile(agents, 'utf8')}<!-- template-only:start -->\nx\n<!-- template-only:end -->\n`,
    )
    const before = await snapshotProject(fixture.target)

    const diagnostics = await runDiagnostics(
      fixture.target,
      fixture.config,
      manifest,
    )

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'MANAGED_OUTPUTS',
        status: 'FAIL',
        message: expect.stringContaining('AGENTS.md') as string,
      }),
    )
    expect(await snapshotProject(fixture.target)).toEqual(before)
  })

  it('reports known secret filenames without reading or printing their values', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    await applyPreview(
      await buildPreview(fixture.target, fixture.config, manifest),
    )
    const secretValue = 'value-that-must-not-be-reported'
    await writeFile(resolve(fixture.target, '.env.production'), secretValue)

    const diagnostics = await runDiagnostics(
      fixture.target,
      fixture.config,
      manifest,
    )
    const finding = diagnostics.find(
      (diagnostic) => diagnostic.code === 'KNOWN_SECRET_FILES',
    )

    expect(finding).toMatchObject({ status: 'FAIL' })
    expect(finding?.message).toContain('.env.production')
    expect(JSON.stringify(finding)).not.toContain(secretValue)
    expect(finding?.limitation).toMatch(/no demuestra ausencia/)
  })

  it('checks public environment names only when an example file exists', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const manifest = fixture.manifest
    await applyPreview(
      await buildPreview(fixture.target, fixture.config, manifest),
    )
    await writeFile(
      resolve(fixture.target, '.env.example'),
      'VITE_PUBLIC_URL=\nAPI_TOKEN=\n',
    )

    const diagnostics = await runDiagnostics(
      fixture.target,
      fixture.config,
      manifest,
    )

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'PUBLIC_ENVIRONMENT',
        status: 'FAIL',
      }),
    )
  })
})
