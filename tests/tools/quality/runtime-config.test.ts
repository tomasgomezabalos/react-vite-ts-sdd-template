// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createQualityFixture } from './helpers/quality-fixture.ts'

const repositoryRoot = resolve(import.meta.dirname, '../../..')
const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

describe('quality runtime and coverage configuration', () => {
  it('keeps Node, npm, scripts and lockfile metadata coherent', async () => {
    const packageJson = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8')) as {
      packageManager?: string
      engines?: Record<string, string>
      devEngines?: Record<string, { name: string; version: string; onFail: string }>
      scripts?: Record<string, string>
    }
    const packageLock = JSON.parse(await readFile(resolve(repositoryRoot, 'package-lock.json'), 'utf8')) as {
      packages?: Record<string, { engines?: Record<string, string> }>
    }

    expect((await readFile(resolve(repositoryRoot, '.nvmrc'), 'utf8')).trim()).toBe('22.23.2')
    expect(packageJson).toMatchObject({
      packageManager: 'npm@10.9.8',
      engines: { node: '>=22.23.2 <23', npm: '>=10.9.8 <11' },
      devEngines: {
        runtime: { name: 'node', version: '22.23.2', onFail: 'error' },
        packageManager: { name: 'npm', version: '10.9.8', onFail: 'error' },
      },
    })
    expect(packageJson.scripts?.test).toBe('vitest run --exclude "tests/tools/**"')
    expect(packageJson.scripts?.['test:coverage']).toBe('vitest run --coverage --exclude "tests/tools/**"')
    expect(packageJson.scripts?.['test:tools']).toBe('vitest run tests/tools')
    expect(packageJson.scripts?.['test:watch']).toBe('vitest --exclude "tests/tools/**"')
    expect(packageJson.scripts?.check).toBe('npm run lint && npm run docs:check && npm run architecture:check && npm run test:coverage && npm run build')
    expect(packageLock.packages?.['']?.engines).toEqual(packageJson.engines)
  })

  it('prevents an incompatible dev runtime from executing the npm script', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await fixture.write('package.json', JSON.stringify({
      name: 'runtime-fixture',
      version: '1.0.0',
      private: true,
      scripts: { probe: "node -e \"process.stdout.write('SCRIPT_EXECUTED')\"" },
      devEngines: {
        runtime: { name: 'node', version: '0.0.0', onFail: 'error' },
      },
    }))

    const result = spawnSync('npm', ['run', 'probe'], {
      cwd: fixture.root,
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
    expect(`${result.stdout}${result.stderr}`).not.toContain('SCRIPT_EXECUTED')
    expect(`${result.stdout}${result.stderr}`).toMatch(/EBADDEVENGINES|devEngines/)
  })

  it('declares global thresholds without auto-update or per-file enforcement', async () => {
    const viteConfig = await readFile(resolve(repositoryRoot, 'vite.config.ts'), 'utf8')

    expect(viteConfig).toContain("include: ['src/**/*.{ts,tsx}']")
    expect(viteConfig).not.toContain("'tools/**/*.ts'")
    expect(viteConfig).toContain('statements: 70')
    expect(viteConfig).toContain('branches: 55')
    expect(viteConfig).toContain('functions: 75')
    expect(viteConfig).toContain('lines: 75')
    expect(viteConfig).toContain('perFile: false')
    expect(viteConfig).toContain('autoUpdate: false')
  })

  it('blocks a controlled coverage result below its configured threshold', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await fixture.write('src/value.ts', `export const selectValue = (enabled: boolean) => {
  if (enabled) return 1
  return 2
}
`)
    await fixture.write('tests/value.test.ts', `test('covers one branch', async () => {
  const { selectValue } = await import('../src/value.ts')
  expect(selectValue(true)).toBe(1)
})
`)
    await fixture.write('vite.config.ts', `export default {
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
}
`)

    const result = spawnSync(process.execPath, [
      resolve(repositoryRoot, 'node_modules/vitest/vitest.mjs'),
      'run',
      '--coverage',
      '--config',
      resolve(fixture.root, 'vite.config.ts'),
    ], {
      cwd: fixture.root,
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
    expect(`${result.stdout}${result.stderr}`).toMatch(/coverage for (branches|lines|statements).*does not meet global threshold/i)
  })

  it('keeps the bootstrap baseline hashes synchronized with managed files', async () => {
    const manifest = JSON.parse(await readFile(resolve(repositoryRoot, 'tools/template/baseline-manifest.json'), 'utf8')) as {
      baselineId?: string
      managedFiles?: Record<string, string>
    }

    expect(manifest.baselineId).toBe('react-vite-ts-sdd-template@2026-08-31-plat-006')
    expect(manifest.managedFiles).toBeDefined()

    for (const [path, expectedHash] of Object.entries(manifest.managedFiles ?? {})) {
      const content = await readFile(resolve(repositoryRoot, path))
      expect(createHash('sha256').update(content).digest('hex'), path).toBe(expectedHash)
    }
  })
})
