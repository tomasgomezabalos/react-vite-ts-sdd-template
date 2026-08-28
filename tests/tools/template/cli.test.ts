// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runDoctor } from '../../../tools/template/doctor.ts'
import { runInit } from '../../../tools/template/init.ts'
import {
  formatDiagnostics,
  formatError,
  formatPreview,
} from '../../../tools/template/output.ts'
import {
  createProjectFixture,
  repositoryRoot,
} from './helpers/project-fixture.ts'
import { pathExists } from '../../../tools/template/project.ts'

const cleanups: Array<() => Promise<void>> = []
const isDerivedProject = await pathExists(resolve(repositoryRoot, '.template-state.json'))

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

const run = (entry: string, args: string[]) => spawnSync(
  process.execPath,
  [resolve(repositoryRoot, entry), ...args],
  { cwd: repositoryRoot, encoding: 'utf8' },
)

describe('template command line interfaces', () => {
  it('exposes help without executing a project operation', async () => {
    const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await expect(runInit(['--help'])).resolves.toBe(0)
    await expect(runDoctor(['--help'])).resolves.toBe(0)
    expect(output).toHaveBeenCalledTimes(2)
  })

  it('formats safe human and JSON output without file contents', () => {
    const preview = {
      target: '/tmp/example',
      configDigest: 'digest',
      token: 'a'.repeat(64),
      operations: [{
        kind: 'modify' as const,
        path: 'README.md',
        beforeHash: 'before',
        afterHash: 'after',
        content: 'private file content',
        mode: 0o644,
      }],
      warnings: [],
    }

    expect(formatPreview(preview, 'human')).toContain('MODIFICAR')
    expect(formatPreview(preview, 'json')).not.toContain('private file content')
    expect(formatDiagnostics('/tmp/example', [], 'json')).toContain('"FAIL": 0')
    expect(formatError(new Error('example'), 'human')).toBe('ERROR: example')
  })

  it.skipIf(isDerivedProject)('previews, applies and diagnoses through real Node processes', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)
    const common = [
      '--target',
      fixture.target,
      '--config',
      fixture.configPath,
      '--format',
      'json',
    ]

    const preview = run('tools/template/init.ts', common)
    expect(preview.status, preview.stderr).toBe(0)
    const previewJson = JSON.parse(preview.stdout) as { token: string }
    expect(previewJson.token).toMatch(/^[a-f0-9]{64}$/)

    const applied = run('tools/template/init.ts', [
      ...common,
      '--apply',
      '--preview-token',
      previewJson.token,
    ])
    expect(applied.status, applied.stderr).toBe(0)
    expect(JSON.parse(applied.stdout)).toMatchObject({ status: 'APPLIED' })

    const doctor = run('tools/template/doctor.ts', common)
    expect(doctor.status, doctor.stderr).toBe(0)
    expect(JSON.parse(doctor.stdout)).toMatchObject({
      summary: expect.objectContaining({ FAIL: 0 }),
    })

    await writeFile(resolve(fixture.target, '.env.production'), 'not-printed')
    const failedDoctor = run('tools/template/doctor.ts', common)
    expect(failedDoctor.status).toBe(1)
    expect(failedDoctor.stdout).not.toContain('not-printed')
  })

  it('uses exit code 2 for invalid invocation', () => {
    const result = run('tools/template/init.ts', ['--format', 'json'])

    expect(result.status).toBe(2)
    expect(JSON.parse(result.stderr)).toMatchObject({ status: 'ERROR' })
  })
})
