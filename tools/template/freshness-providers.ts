import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

export type OutdatedPackage = {
  current: string
  wanted: string
  latest: string
}
export type OutdatedReport = Record<string, OutdatedPackage>
export type AuditCounts = {
  info: number
  low: number
  moderate: number
  high: number
  critical: number
  total: number
}

type Maybe<T> = T | Promise<T>

export type FreshnessProviders = {
  readFile: (path: string) => Maybe<string | null>
  npmOutdated: () => Maybe<OutdatedReport | null>
  npmAudit: () => Maybe<AuditCounts | null>
  fetchJson: (url: string) => Maybe<unknown>
  npmView: (packageName: string, field: string) => Maybe<string | null>
  gh: (args: string[]) => Maybe<string | null>
  now: () => Date
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const output = async (
  command: string,
  args: string[],
  cwd: string,
): Promise<string | null> => {
  try {
    return (await run(command, args, { cwd, maxBuffer: 16 * 1024 * 1024 }))
      .stdout
  } catch (error) {
    // `npm outdated` y `npm audit` salen con código distinto de cero cuando hay resultados.
    const stdout = isRecord(error) ? error.stdout : undefined
    return typeof stdout === 'string' && stdout.trim() !== '' ? stdout : null
  }
}

const parseJson = (text: string | null): unknown => {
  if (text === null) return null
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export const createProviders = (root: string): FreshnessProviders => ({
  readFile: async (path) =>
    readFile(resolve(root, path), 'utf8').catch(() => null),
  npmOutdated: async () => {
    const value = parseJson(await output('npm', ['outdated', '--json'], root))
    if (!isRecord(value) || 'error' in value) return null
    const report: OutdatedReport = {}
    for (const [name, item] of Object.entries(value)) {
      if (
        isRecord(item) &&
        typeof item.current === 'string' &&
        typeof item.wanted === 'string' &&
        typeof item.latest === 'string'
      ) {
        report[name] = {
          current: item.current,
          wanted: item.wanted,
          latest: item.latest,
        }
      }
    }
    return report
  },
  npmAudit: async () => {
    const value = parseJson(
      await output('npm', ['audit', '--omit=dev', '--json'], root),
    )
    if (!isRecord(value) || !isRecord(value.metadata)) return null
    const counts = value.metadata.vulnerabilities
    if (!isRecord(counts)) return null
    const number = (key: string) =>
      typeof counts[key] === 'number' ? counts[key] : 0
    return {
      info: number('info'),
      low: number('low'),
      moderate: number('moderate'),
      high: number('high'),
      critical: number('critical'),
      total: number('total'),
    }
  },
  fetchJson: async (url) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      return response.ok ? await response.json() : null
    } catch {
      return null
    }
  },
  npmView: async (packageName, field) => {
    const value = parseJson(
      await output('npm', ['view', packageName, field, '--json'], root),
    )
    return typeof value === 'string' ? value : null
  },
  gh: (args) => output('gh', args, root),
  now: () => new Date(),
})
