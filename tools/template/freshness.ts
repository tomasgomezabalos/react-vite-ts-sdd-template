import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  checkAudit,
  checkDependencies,
  checkGitHub,
  checkIgnoreRules,
  checkNode,
  checkPendingChanges,
  parseIgnoreRules,
} from './freshness-checks.ts'
import type { FreshnessEntry } from './freshness-checks.ts'
import { createProviders } from './freshness-providers.ts'
import type { FreshnessProviders } from './freshness-providers.ts'
import type { OutputFormat } from './types.ts'

type Io = { stdout: (value: string) => void; stderr: (value: string) => void }

const usage = `Uso:
  npm run template:freshness [-- --format human|json]

Informe de solo lectura sobre la frescura de la plantilla (ADR-0020). Estados:
ATTENTION (requiere decisión), BLOCKED (bloqueado a propósito), CURRENT y UNKNOWN.
Código de salida: 0 sin ATTENTION, 1 con alguna, 2 ante un uso inválido.`

const nodeScheduleUrl =
  'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json'
const nodeDistUrl = 'https://nodejs.org/dist/index.json'

const parseArguments = (
  values: string[],
): { format: OutputFormat; help: boolean } => {
  const result = { format: 'human' as OutputFormat, help: false }
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (value === '--help' || value === '-h') result.help = true
    else if (value === '--format') {
      const next = values[index + 1]
      if (next !== 'human' && next !== 'json')
        throw new Error('--format debe ser human o json.')
      result.format = next
      index += 1
    } else throw new Error(`Argumento desconocido: ${String(value)}`)
  }
  return result
}

export const collectEntries = async (
  providers: FreshnessProviders,
): Promise<FreshnessEntry[]> => {
  const rules = parseIgnoreRules(
    (await providers.readFile('.github/dependabot.yml')) ?? '',
  )
  const [
    outdated,
    audit,
    schedule,
    releases,
    nvmrc,
    pullRequests,
    runs,
    readme,
  ] = await Promise.all([
    providers.npmOutdated(),
    providers.npmAudit(),
    providers.fetchJson(nodeScheduleUrl),
    providers.fetchJson(nodeDistUrl),
    providers.readFile('.nvmrc'),
    providers.gh([
      'pr',
      'list',
      '--state',
      'open',
      '--json',
      'number,title,author',
    ]),
    providers.gh([
      'run',
      'list',
      '--branch',
      'main',
      '--limit',
      '10',
      '--json',
      'workflowName,status,conclusion,headSha',
    ]),
    providers.readFile('docs/platform/README.md'),
  ])
  return [
    checkDependencies(outdated, rules),
    checkAudit(audit),
    checkNode({ nvmrc, schedule, releases, now: providers.now() }),
    ...(await checkIgnoreRules({ rules, view: providers.npmView })),
    ...checkGitHub(pullRequests, runs),
    await checkPendingChanges(readme, providers.readFile),
  ]
}

const formatHuman = (entries: FreshnessEntry[]): string => {
  const summary = ['ATTENTION', 'BLOCKED', 'CURRENT', 'UNKNOWN']
    .map(
      (status) =>
        `${status}=${entries.filter((entry) => entry.status === status).length}`,
    )
    .join(' ')
  const lines = [
    'Frescura de la plantilla (solo lectura; no actualiza nada).',
    `Resumen: ${summary}`,
    '',
  ]
  for (const entry of entries) {
    lines.push(`[${entry.status}] ${entry.code}: ${entry.message}`)
    for (const detail of entry.details ?? []) lines.push(`  - ${detail}`)
  }
  return lines.join('\n')
}

export const runFreshness = async (
  values: string[],
  providers: FreshnessProviders,
  io: Io = {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value),
  },
): Promise<number> => {
  try {
    const args = parseArguments(values)
    if (args.help) {
      io.stdout(`${usage}\n`)
      return 0
    }
    const entries = await collectEntries(providers)
    io.stdout(
      `${
        args.format === 'json'
          ? JSON.stringify(
              { generatedAt: providers.now().toISOString(), entries },
              null,
              2,
            )
          : formatHuman(entries)
      }\n`,
    )
    return entries.some((entry) => entry.status === 'ATTENTION') ? 1 : 0
  } catch (error) {
    io.stderr(
      `ERROR: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    return 2
  }
}

const isMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false

if (isMain) {
  process.exitCode = await runFreshness(
    process.argv.slice(2),
    createProviders(process.cwd()),
  )
}
