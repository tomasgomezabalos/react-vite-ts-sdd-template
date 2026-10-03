import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { EffectiveProjectConfig, ProjectConfig } from './types.ts'

const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/
const SECRET_KEY =
  /(?:password|passwd|secret|token|credential|private.?key|api.?key)/i

export const INITIAL_PACKAGE_VERSION = '0.1.0' as const
export const QUALITY_COMMAND = 'npm run check' as const

type JsonObject = Record<string, unknown>

export class ConfigError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`Configuración inválida:\n- ${issues.join('\n- ')}`)
    this.name = 'ConfigError'
    this.issues = issues
  }
}

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const assertObject = (
  value: unknown,
  path: string,
  issues: string[],
): JsonObject => {
  if (!isObject(value)) {
    issues.push(`${path} debe ser un objeto.`)
    return {}
  }
  return value
}

const assertExactKeys = (
  value: JsonObject,
  allowed: readonly string[],
  path: string,
  issues: string[],
  required: readonly string[] = allowed,
) => {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) issues.push(`${path}.${key} no está permitido.`)
  }
  for (const key of required) {
    if (!(key in value)) issues.push(`${path}.${key} es obligatorio.`)
  }
}

const readString = (value: unknown, path: string, issues: string[]): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push(`${path} debe ser una cadena no vacía.`)
    return ''
  }
  if (value !== value.trim()) {
    issues.push(`${path} no puede empezar ni terminar con espacios.`)
  }
  return value
}

const findSecretKeys = (value: unknown, path: string, issues: string[]) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findSecretKeys(item, `${path}[${index}]`, issues),
    )
    return
  }
  if (!isObject(value)) return
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) {
      issues.push(
        `${path}.${key} parece un campo de secreto y no está permitido.`,
      )
    }
    findSecretKeys(child, `${path}.${key}`, issues)
  }
}

export const suggestPackageName = (displayName: string): string =>
  displayName
    .normalize('NFKD')
    .replaceAll(/\p{M}+/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')

export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export const hashText = (value: string): string =>
  createHash('sha256').update(value).digest('hex')

export const effectiveProjectConfig = (
  config: ProjectConfig,
): EffectiveProjectConfig => ({
  ...config,
  identity: {
    ...config.identity,
    packageVersion: INITIAL_PACKAGE_VERSION,
    htmlTitle: config.identity.displayName,
  },
})

export const configDigest = (config: ProjectConfig): string =>
  hashText(canonicalJson(effectiveProjectConfig(config)))

export const validateProjectConfig = (value: unknown): ProjectConfig => {
  const issues: string[] = []
  const root = assertObject(value, '$', issues)
  const rootKeys = ['$schema', 'schemaVersion', 'identity'] as const
  assertExactKeys(root, rootKeys, '$', issues, ['schemaVersion', 'identity'])
  findSecretKeys(root, '$', issues)
  if ('$schema' in root) readString(root.$schema, '$.$schema', issues)

  if (root.schemaVersion !== 2) {
    issues.push(
      '$.schemaVersion debe ser 2; el contrato v1 ya no es compatible.',
    )
  }

  const identity = assertObject(root.identity, '$.identity', issues)
  assertExactKeys(
    identity,
    ['displayName', 'packageName'],
    '$.identity',
    issues,
  )
  const displayName = readString(
    identity.displayName,
    '$.identity.displayName',
    issues,
  )
  const packageName = readString(
    identity.packageName,
    '$.identity.packageName',
    issues,
  )
  if (packageName.length > 214 || !PACKAGE_NAME.test(packageName)) {
    issues.push(
      '$.identity.packageName debe ser un nombre npm válido en minúsculas.',
    )
  }

  if (issues.length > 0) throw new ConfigError(issues)

  return {
    schemaVersion: 2,
    identity: {
      displayName,
      packageName,
    },
  }
}

export const loadProjectConfig = async (
  path: string,
): Promise<ProjectConfig> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new ConfigError([`${path} no se pudo leer como JSON: ${message}`])
  }
  return validateProjectConfig(parsed)
}
