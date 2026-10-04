// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runFreshness } from '../../../tools/template/freshness.ts'
import type { FreshnessProviders } from '../../../tools/template/freshness-providers.ts'
import { renderManagedOutputs } from '../../../tools/template/managed-files.ts'
import { createProjectFixture } from './helpers/project-fixture.ts'

const repositoryRoot = resolve(import.meta.dirname, '../../..')

const dependabot = `version: 2

updates:
  - package-ecosystem: npm
    directory: /
    ignore:
      - dependency-name: '@types/node'
        update-types:
          - version-update:semver-major
      # typescript-eslint 8.x declara el peer typescript >=4.8.4 <6.1.0.
      # Retirar cuando typescript-eslint admita TypeScript 7.
      - dependency-name: typescript
        versions:
          - ^7.0.0
      # MSW 3 exige migrar los mocks.
      - dependency-name: msw
        versions:
          - ^3.0.0
`

const readme = [
  '# Plataforma',
  '',
  '| Alias | Artefactos | Estado | Responsabilidad |',
  '| --- | --- | --- | --- |',
  '| `PLAT-001` | [x](specs/001/spec.md) | Modelo histórico: `VALIDATED` | Histórico. |',
  '| `PLAT-009` | [x](specs/009/quick-change.md) | `APPROVED` / `VALIDATED` | Dependabot. |',
].join('\n')

type Overrides = Partial<FreshnessProviders> & {
  files?: Record<string, string>
}

const providers = ({
  files = {},
  ...overrides
}: Overrides = {}): FreshnessProviders => {
  const contents: Record<string, string> = {
    '.nvmrc': '22.23.2\n',
    'package.json': JSON.stringify({ packageManager: 'npm@10.9.8' }),
    '.github/dependabot.yml': dependabot,
    'docs/platform/README.md': readme,
    ...files,
  }
  return {
    readFile: (path) => contents[path] ?? null,
    npmOutdated: () => ({}),
    npmAudit: () => ({
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0,
    }),
    fetchJson: (url) =>
      url.endsWith('schedule.json')
        ? {
            v22: {
              start: '2024-04-24',
              lts: '2024-10-29',
              maintenance: '2025-10-21',
              end: '2027-04-30',
            },
            v24: {
              start: '2025-05-06',
              lts: '2025-10-28',
              maintenance: '2026-10-20',
              end: '2028-04-30',
            },
          }
        : [
            { version: 'v24.21.0', npm: '11.19.0', lts: 'Krypton' },
            { version: 'v22.23.2', npm: '10.9.8', lts: 'Jod' },
          ],
    npmView: (name) =>
      name === 'typescript-eslint'
        ? '>=4.8.4 <6.1.0'
        : name === 'msw'
          ? '3.0.2'
          : '7.0.2',
    gh: (args) =>
      args[0] === 'pr'
        ? '[]'
        : '[{"workflowName":"Quality","status":"completed","conclusion":"success","headSha":"abc"}]',
    now: () => new Date('2025-06-01T10:00:00Z'),
    ...overrides,
  }
}

const run = async (
  overrides: Overrides = {},
  argv: string[] = ['--format', 'json'],
) => {
  const out: string[] = []
  const err: string[] = []
  const code = await runFreshness(argv, providers(overrides), {
    stdout: (value) => out.push(value),
    stderr: (value) => err.push(value),
  })
  const text = out.join('')
  const entries = argv.includes('json')
    ? (
        JSON.parse(text) as {
          entries: Array<{
            code: string
            status: string
            message: string
            details?: string[]
          }>
        }
      ).entries
    : []
  return { code, text, err: err.join(''), entries }
}

const entry = (
  entries: Awaited<ReturnType<typeof run>>['entries'],
  code: string,
) => entries.find((item) => item.code === code)

const cleanups: Array<() => Promise<void>> = []
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

describe('template freshness', () => {
  it('reports everything current with exit code 0 when nothing needs a decision', async () => {
    const result = await run({
      files: { '.nvmrc': '22.23.2\n' },
    })

    expect(
      result.entries.filter((item) => item.status === 'ATTENTION'),
    ).toEqual([])
    expect(result.code).toBe(0)
    expect(entry(result.entries, 'DEPENDENCIES')?.status).toBe('CURRENT')
    expect(entry(result.entries, 'AUDIT')?.status).toBe('CURRENT')
  })

  it.each([
    ['patch', { current: '1.0.0', wanted: '1.0.1', latest: '1.0.1' }],
    ['minor', { current: '1.0.0', wanted: '1.1.0', latest: '1.1.0' }],
    ['major', { current: '1.0.0', wanted: '1.0.0', latest: '2.0.0' }],
  ])(
    'flags an outdated %s dependency for a decision',
    async (level, report) => {
      const result = await run({ npmOutdated: () => ({ react: report }) })

      const dependencies = entry(result.entries, 'DEPENDENCIES')
      expect(dependencies?.status).toBe('ATTENTION')
      expect(dependencies?.details?.join('\n')).toMatch(
        new RegExp(`react.*${level}`),
      )
      expect(result.code).toBe(1)
    },
  )

  it('marks dependencies covered by an ignore rule as blocked with the cause from the comments', async () => {
    const result = await run({
      npmOutdated: () => ({
        typescript: { current: '6.0.3', wanted: '6.0.3', latest: '7.0.2' },
        '@types/node': {
          current: '22.20.5',
          wanted: '22.20.5',
          latest: '26.6.4',
        },
      }),
    })

    const dependencies = entry(result.entries, 'DEPENDENCIES')
    expect(dependencies?.status).toBe('BLOCKED')
    expect(dependencies?.details?.join('\n')).toContain('typescript-eslint')
    expect(dependencies?.details?.join('\n')).toContain('@types/node')
    expect(result.code).toBe(0)
  })

  it.each([
    [
      'high vulnerabilities',
      { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 },
      'ATTENTION',
    ],
    [
      'only moderate vulnerabilities',
      { info: 0, low: 0, moderate: 2, high: 0, critical: 0, total: 2 },
      'CURRENT',
    ],
    [
      'no vulnerabilities',
      { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
      'CURRENT',
    ],
    ['an unavailable audit', null, 'UNKNOWN'],
  ])('classifies %s', async (_name, counts, status) => {
    const result = await run({ npmAudit: () => counts })

    expect(entry(result.entries, 'AUDIT')?.status).toBe(status)
  })

  it.each([
    [
      'a newer patch of the pinned line',
      { files: { '.nvmrc': '22.23.1\n' } },
      'ATTENTION',
    ],
    [
      'a maintenance line with another LTS line already active',
      { now: () => new Date('2026-10-25T10:00:00Z') },
      'ATTENTION',
    ],
    [
      'an end of life within 180 days',
      { now: () => new Date('2026-12-01T10:00:00Z') },
      'ATTENTION',
    ],
    ['a supported, fully patched line', {}, 'CURRENT'],
    ['unavailable sources', { fetchJson: () => null }, 'UNKNOWN'],
  ] satisfies Array<[string, Overrides, string]>)(
    'reports Node for %s',
    async (_name, overrides, status) => {
      const result = await run(overrides)

      expect(entry(result.entries, 'NODE')?.status).toBe(status)
    },
  )

  it('keeps an ignore rule blocked while its cause persists and flags it when it ends', async () => {
    const blocked = await run()
    expect(entry(blocked.entries, 'IGNORE_RULE:typescript')?.status).toBe(
      'BLOCKED',
    )
    expect(entry(blocked.entries, 'IGNORE_RULE:msw')?.status).toBe('BLOCKED')

    const released = await run({
      npmView: (name) =>
        name === 'typescript-eslint' ? '>=4.8.4 <7.1.0' : '7.0.2',
    })
    expect(entry(released.entries, 'IGNORE_RULE:typescript')?.status).toBe(
      'ATTENTION',
    )

    const unknown = await run({ npmView: () => null })
    expect(entry(unknown.entries, 'IGNORE_RULE:typescript')?.status).toBe(
      'UNKNOWN',
    )
  })

  it('reports GitHub data and falls back to unknown without gh', async () => {
    const withoutGh = await run({ gh: () => null })
    expect(entry(withoutGh.entries, 'DEPENDABOT_PRS')?.status).toBe('UNKNOWN')
    expect(entry(withoutGh.entries, 'CI')?.status).toBe('UNKNOWN')
    expect(withoutGh.code).toBe(0)

    const busy = await run({
      gh: (args) =>
        args[0] === 'pr'
          ? '[{"number":4,"title":"bump x","author":{"login":"app/dependabot"}}]'
          : '[{"workflowName":"Quality","status":"completed","conclusion":"failure","headSha":"abc"}]',
    })
    expect(entry(busy.entries, 'DEPENDABOT_PRS')?.status).toBe('ATTENTION')
    expect(entry(busy.entries, 'CI')?.status).toBe('ATTENTION')
  })

  it('lists pending platform changes and blocks those with an application condition', async () => {
    const pending = [
      readme,
      '| `PLAT-019` | [x](specs/019/quick-change.md) | `APPROVED` / `NOT_STARTED` | Node 26. |',
      '| `PLAT-021` | [x](specs/021/quick-change.md) | `DRAFT` / `NOT_STARTED` | Otro. |',
    ].join('\n')
    const result = await run({
      files: {
        'docs/platform/README.md': pending,
        'docs/platform/specs/019/quick-change.md':
          '# x\n\n## Condición de aplicación\n\nNo se aplica antes del 2026-10-28.\n',
        'docs/platform/specs/021/quick-change.md': '# y\n',
      },
    })

    const changes = entry(result.entries, 'PENDING_CHANGES')
    expect(changes?.status).toBe('ATTENTION')
    expect(changes?.details?.join('\n')).toMatch(/PLAT-019.*2026-10-28/)
    expect(changes?.details?.join('\n')).toContain('PLAT-021')

    const onlyBlocked = await run({
      files: {
        'docs/platform/README.md': [
          readme,
          '| `PLAT-019` | [x](specs/019/quick-change.md) | `APPROVED` / `NOT_STARTED` | Node 26. |',
        ].join('\n'),
        'docs/platform/specs/019/quick-change.md':
          '# x\n\n## Condición de aplicación\n\nNo se aplica antes del 2026-10-28.\n',
      },
    })
    expect(entry(onlyBlocked.entries, 'PENDING_CHANGES')?.status).toBe(
      'BLOCKED',
    )
  })

  it('never fails because of an unavailable source', async () => {
    const result = await run({
      npmOutdated: () => null,
      npmAudit: () => null,
      fetchJson: () => null,
      npmView: () => null,
      gh: () => null,
    })

    expect(result.code).toBe(0)
    expect(
      result.entries.filter((item) => item.status === 'UNKNOWN').length,
    ).toBeGreaterThanOrEqual(5)
  })

  it('prints a readable report and rejects invalid arguments', async () => {
    const human = await run({}, [])
    expect(human.code).toBe(0)
    expect(human.text).toMatch(/\[CURRENT\] DEPENDENCIES/)

    const invalid = await run({}, ['--format', 'xml'])
    expect(invalid.code).toBe(2)
    expect(invalid.err).toMatch(/--format/)

    const help = await run({}, ['--help'])
    expect(help.code).toBe(0)
    expect(help.text).toMatch(/template:freshness/)
  })

  it('does not modify the repository', async () => {
    const status = () =>
      spawnSync('git', ['-C', repositoryRoot, 'status', '--porcelain=v1'], {
        encoding: 'utf8',
      }).stdout
    const before = status()

    await runFreshness(
      ['--format', 'json'],
      {
        ...providers(),
        readFile: (path) =>
          readFile(resolve(repositoryRoot, path), 'utf8').catch(() => null),
      },
      { stdout: () => undefined, stderr: () => undefined },
    )

    expect(status()).toBe(before)
  })

  it('is removed from the scripts of a derived project', async () => {
    const fixture = await createProjectFixture()
    cleanups.push(fixture.cleanup)

    const outputs = await renderManagedOutputs(fixture.target, fixture.config)

    expect(outputs.get('package.json')).not.toContain('template:freshness')
    expect(
      await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
    ).toContain('template:freshness')
  })
})
