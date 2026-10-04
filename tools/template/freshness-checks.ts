import type {
  AuditCounts,
  FreshnessProviders,
  OutdatedReport,
} from './freshness-providers.ts'

export type FreshnessStatus = 'ATTENTION' | 'BLOCKED' | 'CURRENT' | 'UNKNOWN'

export type FreshnessEntry = {
  code: string
  status: FreshnessStatus
  message: string
  details?: string[]
}

export type IgnoreRule = {
  name: string
  versions: string[]
  updateTypes: string[]
  reason: string
}

type Version = [number, number, number]

const DAY = 86_400_000
const END_OF_LIFE_WARNING_DAYS = 180

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseVersion = (value: string): Version | null => {
  const match = value.match(/(\d+)\.(\d+)\.(\d+)/)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

const compare = (left: Version, right: Version): number =>
  left[0] - right[0] || left[1] - right[1] || left[2] - right[2]

const level = (from: Version, to: Version): 'major' | 'minor' | 'patch' =>
  to[0] !== from[0] ? 'major' : to[1] !== from[1] ? 'minor' : 'patch'

const comparator = (version: Version, token: string): boolean => {
  const match = token.match(/^(>=|<=|>|<|=|\^)?(\d+\.\d+\.\d+)$/)
  const target = match?.[2] ? parseVersion(match[2]) : null
  if (!match || !target) return false
  const order = compare(version, target)
  switch (match[1]) {
    case '>=':
      return order >= 0
    case '<=':
      return order <= 0
    case '>':
      return order > 0
    case '<':
      return order < 0
    case '^':
      return version[0] === target[0] && order >= 0
    default:
      return order === 0
  }
}

export const rangeAdmits = (range: string, version: string): boolean => {
  const target = parseVersion(version)
  if (!target) return false
  return range.split('||').some((alternative) =>
    alternative
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => comparator(target, token)),
  )
}

export const parseIgnoreRules = (yaml: string): IgnoreRule[] => {
  const rules: IgnoreRule[] = []
  let comments: string[] = []
  let current: IgnoreRule | null = null
  let list: 'versions' | 'updateTypes' | null = null
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) {
      comments.push(trimmed.replace(/^#\s?/, ''))
      continue
    }
    const name = trimmed.match(/^- dependency-name:\s*['"]?([^'"\s]+)['"]?$/)
    if (name?.[1]) {
      current = {
        name: name[1],
        versions: [],
        updateTypes: [],
        reason: comments.join(' ').trim(),
      }
      rules.push(current)
      comments = []
      list = null
      continue
    }
    comments = []
    if (trimmed === 'versions:') list = 'versions'
    else if (trimmed === 'update-types:') list = 'updateTypes'
    else if (current && list && trimmed.startsWith('- '))
      current[list].push(trimmed.slice(2).replace(/['"]/g, ''))
    else if (!trimmed.startsWith('- ')) list = list && current ? list : null
  }
  return rules
}

export const checkDependencies = (
  outdated: OutdatedReport | null,
  rules: IgnoreRule[],
): FreshnessEntry => {
  const code = 'DEPENDENCIES'
  if (outdated === null) {
    return {
      code,
      status: 'UNKNOWN',
      message: 'No se pudo ejecutar `npm outdated`.',
    }
  }
  const attention: string[] = []
  const blocked: string[] = []
  for (const name of Object.keys(outdated).sort()) {
    const item = outdated[name]
    if (!item) continue
    const current = parseVersion(item.current)
    const latest = parseVersion(item.latest)
    const wanted = parseVersion(item.wanted)
    const rule = rules.find((candidate) => candidate.name === name)
    const covered =
      rule !== undefined &&
      latest !== null &&
      (rule.versions.some((range) => {
        const major = parseVersion(range)?.[0]
        return major !== undefined && major === latest[0]
      }) ||
        (rule.updateTypes.includes('version-update:semver-major') &&
          current !== null &&
          latest[0] > current[0]))
    if (covered && rule) {
      blocked.push(
        `${name} ${item.current} → ${item.latest} (bloqueada): ${rule.reason || 'regla de ignorado de Dependabot'}`,
      )
      continue
    }
    const target =
      wanted && current && compare(wanted, current) > 0 ? wanted : latest
    const text =
      target === wanted && item.wanted !== item.current
        ? item.wanted
        : item.latest
    attention.push(
      `${name} ${item.current} → ${text}${current && target ? ` (${level(current, target)})` : ''}`,
    )
  }
  if (attention.length === 0 && blocked.length === 0) {
    return {
      code,
      status: 'CURRENT',
      message: 'Todas las dependencias están en su última versión.',
    }
  }
  return {
    code,
    status: attention.length > 0 ? 'ATTENTION' : 'BLOCKED',
    message:
      attention.length > 0
        ? `${attention.length} dependencia(s) desactualizada(s) requieren decisión.`
        : `${blocked.length} dependencia(s) desactualizada(s), todas bloqueadas a propósito.`,
    details: [...attention, ...blocked],
  }
}

export const checkAudit = (counts: AuditCounts | null): FreshnessEntry => {
  const code = 'AUDIT'
  if (counts === null) {
    return {
      code,
      status: 'UNKNOWN',
      message: 'No se pudo ejecutar `npm audit`.',
    }
  }
  if (counts.high + counts.critical > 0) {
    return {
      code,
      status: 'ATTENTION',
      message: `Vulnerabilidades de producción: ${counts.high} altas y ${counts.critical} críticas.`,
    }
  }
  return {
    code,
    status: 'CURRENT',
    message:
      counts.total === 0
        ? 'Sin vulnerabilidades de producción conocidas.'
        : `Sin vulnerabilidades altas o críticas (${counts.total} de nivel inferior).`,
  }
}

type NodeInput = {
  nvmrc: string | null
  schedule: unknown
  releases: unknown
  now: Date
}

export const checkNode = ({
  nvmrc,
  schedule,
  releases,
  now,
}: NodeInput): FreshnessEntry => {
  const code = 'NODE'
  const pinned = nvmrc ? parseVersion(nvmrc) : null
  if (!pinned || !isRecord(schedule) || !Array.isArray(releases)) {
    return {
      code,
      status: 'UNKNOWN',
      message: 'No se pudo comparar la versión de Node con su calendario.',
    }
  }
  const line = schedule[`v${pinned[0]}`]
  if (!isRecord(line) || typeof line.end !== 'string') {
    return {
      code,
      status: 'UNKNOWN',
      message: `El calendario no describe la línea v${pinned[0]}.`,
    }
  }
  const issues: string[] = []
  const details: string[] = []
  const lineReleases = releases
    .filter(isRecord)
    .map((release) => ({
      version: typeof release.version === 'string' ? release.version : '',
      npm: typeof release.npm === 'string' ? release.npm : undefined,
    }))
    .filter((release) => release.version.startsWith(`v${pinned[0]}.`))
    .map((release) => ({ ...release, parsed: parseVersion(release.version) }))
    .filter(
      (release): release is typeof release & { parsed: Version } =>
        release.parsed !== null,
    )
    .sort((left, right) => compare(right.parsed, left.parsed))
  const latest = lineReleases[0]
  if (latest && compare(latest.parsed, pinned) > 0) {
    issues.push(`Hay un parche más reciente de la línea: ${latest.version}.`)
    if (latest.npm) details.push(`${latest.version} incluye npm ${latest.npm}.`)
  }
  const maintenance =
    typeof line.maintenance === 'string' ? Date.parse(line.maintenance) : NaN
  const inMaintenance =
    !Number.isNaN(maintenance) && maintenance <= now.getTime()
  const newerLts = Object.entries(schedule)
    .filter(([key, value]) => {
      const major = Number(key.replace('v', ''))
      return (
        major > pinned[0] &&
        isRecord(value) &&
        typeof value.lts === 'string' &&
        Date.parse(value.lts) <= now.getTime() &&
        typeof value.end === 'string' &&
        Date.parse(value.end) > now.getTime()
      )
    })
    .map(([key]) => key)
  if (inMaintenance && newerLts.length > 0) {
    issues.push(
      `La línea v${pinned[0]} está en mantenimiento y ya hay LTS activa: ${newerLts.join(', ')}.`,
    )
  }
  const days = Math.floor((Date.parse(line.end) - now.getTime()) / DAY)
  if (days <= END_OF_LIFE_WARNING_DAYS) {
    issues.push(`Fin de vida de la línea el ${line.end} (${days} días).`)
  }
  return {
    code,
    status: issues.length > 0 ? 'ATTENTION' : 'CURRENT',
    message:
      issues.length > 0
        ? `Node ${pinned.join('.')}: ${issues.length} aviso(s).`
        : `Node ${pinned.join('.')} está en una línea soportada y al día (fin de vida ${line.end}).`,
    ...(issues.length + details.length > 0
      ? { details: [...issues, ...details] }
      : {}),
  }
}

type RuleInput = {
  rules: IgnoreRule[]
  view: FreshnessProviders['npmView']
}

export const checkIgnoreRules = async ({
  rules,
  view,
}: RuleInput): Promise<FreshnessEntry[]> => {
  const entries: FreshnessEntry[] = []
  for (const rule of rules) {
    const code = `IGNORE_RULE:${rule.name}`
    const latest = await view(rule.name, 'version')
    if (latest === null) {
      entries.push({
        code,
        status: 'UNKNOWN',
        message: `No se pudo consultar la última versión de ${rule.name}.`,
      })
      continue
    }
    if (rule.name === 'typescript') {
      const peer = await view(
        'typescript-eslint',
        'peerDependencies.typescript',
      )
      if (peer === null) {
        entries.push({
          code,
          status: 'UNKNOWN',
          message: 'No se pudo consultar el peer de typescript-eslint.',
        })
        continue
      }
      const admits = rangeAdmits(peer, latest)
      entries.push({
        code,
        status: admits ? 'ATTENTION' : 'BLOCKED',
        message: admits
          ? `typescript-eslint (peer ${peer}) ya admite typescript ${latest}: la regla de ignorado puede retirarse.`
          : `typescript ${latest} sigue ignorado: typescript-eslint declara el peer ${peer}.`,
        details: rule.reason ? [rule.reason] : [],
      })
      continue
    }
    entries.push({
      code,
      status: 'BLOCKED',
      message: `${rule.name} ${latest} sigue ignorado.`,
      details: rule.reason ? [rule.reason] : [],
    })
  }
  return entries
}

type GitHubAuthor = { login?: string }

export const checkGitHub = (
  pullRequests: string | null,
  runs: string | null,
): FreshnessEntry[] => {
  const parse = (text: string | null): unknown[] | null => {
    if (text === null) return null
    try {
      const value = JSON.parse(text) as unknown
      return Array.isArray(value) ? value : null
    } catch {
      return null
    }
  }
  const entries: FreshnessEntry[] = []
  const prs = parse(pullRequests)
  if (prs === null) {
    entries.push({
      code: 'DEPENDABOT_PRS',
      status: 'UNKNOWN',
      message: 'No se pudo consultar GitHub (¿`gh` no está disponible?).',
    })
  } else {
    const open = prs.filter(isRecord).filter((item) => {
      const author = item.author as GitHubAuthor | undefined
      return (author?.login ?? '').includes('dependabot')
    })
    entries.push({
      code: 'DEPENDABOT_PRS',
      status: open.length > 0 ? 'ATTENTION' : 'CURRENT',
      message:
        open.length > 0
          ? `${open.length} pull request(s) de Dependabot abiertos.`
          : 'Sin pull requests de Dependabot abiertos.',
      ...(open.length > 0
        ? {
            details: open.map(
              (item) => `#${String(item.number)} ${String(item.title)}`,
            ),
          }
        : {}),
    })
  }
  const list = parse(runs)
  if (list === null) {
    entries.push({
      code: 'CI',
      status: 'UNKNOWN',
      message: 'No se pudo consultar la CI de la rama principal.',
    })
  } else {
    const latest = new Map<string, Record<string, unknown>>()
    for (const item of list.filter(isRecord)) {
      const name = String(item.workflowName)
      if (!latest.has(name)) latest.set(name, item)
    }
    const failed = [...latest.entries()].filter(([, item]) =>
      ['failure', 'timed_out'].includes(String(item.conclusion)),
    )
    entries.push({
      code: 'CI',
      status: failed.length > 0 ? 'ATTENTION' : 'CURRENT',
      message:
        failed.length > 0
          ? `Último resultado fallido en la rama principal: ${failed.map(([name]) => name).join(', ')}.`
          : 'Los últimos resultados de la rama principal no son fallos.',
    })
  }
  return entries
}

export const checkPendingChanges = async (
  readme: string | null,
  read: FreshnessProviders['readFile'],
): Promise<FreshnessEntry> => {
  const code = 'PENDING_CHANGES'
  if (readme === null) {
    return {
      code,
      status: 'UNKNOWN',
      message: 'No se pudo leer docs/platform/README.md.',
    }
  }
  const attention: string[] = []
  const blocked: string[] = []
  for (const line of readme.split('\n')) {
    const row = line.match(
      /^\| `PLAT-(\d{3})` \| (.*?) \| (.*?) \| (.*?) \|\s*$/,
    )
    if (!row) continue
    const [, id = '', artifacts = '', state = '', description = ''] = row
    if (!/`(DRAFT|NOT_STARTED)`/.test(state)) continue
    const link = artifacts.match(/\((specs\/[^)]+)\)/)?.[1]
    const record = link ? await read(`docs/platform/${link}`) : null
    const condition = record?.match(
      /^## Condición de aplicación\s*\n+([^\n]+)/m,
    )?.[1]
    const sentence = condition?.split(/(?<=\.)\s/)[0]?.replaceAll(/\*\*|`/g, '')
    if (sentence) blocked.push(`PLAT-${id}: bloqueado, ${sentence}`)
    else attention.push(`PLAT-${id}: ${description.trim()} (${state.trim()})`)
  }
  if (attention.length === 0 && blocked.length === 0) {
    return {
      code,
      status: 'CURRENT',
      message: 'No hay cambios de plataforma pendientes de aplicar.',
    }
  }
  return {
    code,
    status: attention.length > 0 ? 'ATTENTION' : 'BLOCKED',
    message: `${attention.length + blocked.length} cambio(s) de plataforma pendiente(s).`,
    details: [...attention, ...blocked],
  }
}
