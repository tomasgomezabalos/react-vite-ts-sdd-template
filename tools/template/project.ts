import { spawnSync } from 'node:child_process'
import {
  access,
  lstat,
  readFile,
  readdir,
  realpath,
  stat,
} from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashText } from './config.ts'
import type {
  BaselineManifest,
  InitializationState,
  ProjectConfig,
} from './types.ts'

export class ProjectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectError'
  }
}

const templateDirectory = dirname(fileURLToPath(import.meta.url))

export const loadBaselineManifest = async (): Promise<BaselineManifest> => {
  const path = resolve(templateDirectory, 'baseline-manifest.json')
  let value: unknown
  try {
    value = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new ProjectError(
      `No se puede leer el manifiesto de baseline: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  if (
    typeof value !== 'object'
    || value === null
    || !('schemaVersion' in value)
    || value.schemaVersion !== 1
    || !('baselineId' in value)
    || typeof value.baselineId !== 'string'
    || !('canonicalRemote' in value)
    || typeof value.canonicalRemote !== 'string'
    || !('managedFiles' in value)
    || typeof value.managedFiles !== 'object'
    || value.managedFiles === null
  ) {
    throw new ProjectError('El manifiesto de baseline no cumple el contrato esperado.')
  }
  if (
    Object.entries(value.managedFiles).some(([path, hash]) =>
      path.trim() === '' || isAbsolute(path) || path.split('/').includes('..')
      || typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash))
  ) {
    throw new ProjectError('El manifiesto contiene una ruta o un hash gestionado inválido.')
  }
  return value as BaselineManifest
}

const isInside = (root: string, candidate: string): boolean => {
  const difference = relative(root, candidate)
  return difference === '' || (!difference.startsWith(`..${sep}`) && difference !== '..' && !isAbsolute(difference))
}

export const resolveTarget = async (value: string): Promise<string> => {
  if (value.trim() === '') throw new ProjectError('--target no puede estar vacío.')
  let target: string
  try {
    target = await realpath(resolve(value))
  } catch {
    throw new ProjectError(`El destino no existe o no es accesible: ${value}`)
  }
  if (!(await stat(target)).isDirectory()) {
    throw new ProjectError(`El destino no es un directorio: ${target}`)
  }
  return target
}

export const resolveSafePath = async (
  target: string,
  relativePath: string,
): Promise<string> => {
  if (relativePath.trim() === '' || isAbsolute(relativePath)) {
    throw new ProjectError(`Ruta gestionada inválida: ${relativePath}`)
  }
  const candidate = resolve(target, relativePath)
  if (!isInside(target, candidate)) {
    throw new ProjectError(`La ruta escapa del destino: ${relativePath}`)
  }

  const parts = relative(target, candidate).split(sep).filter(Boolean)
  let current = target
  for (const part of parts) {
    current = resolve(current, part)
    try {
      const details = await lstat(current)
      if (details.isSymbolicLink()) {
        const linked = await realpath(current)
        if (!isInside(target, linked)) {
          throw new ProjectError(`El enlace simbólico escapa del destino: ${relativePath}`)
        }
        throw new ProjectError(`No se modifican rutas simbólicas gestionadas: ${relativePath}`)
      }
    } catch (error) {
      if (error instanceof ProjectError) throw error
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      break
    }
  }
  return candidate
}

export const readProjectFile = async (
  target: string,
  relativePath: string,
): Promise<{ content: string; hash: string; mode: number } | null> => {
  const path = await resolveSafePath(target, relativePath)
  try {
    const details = await stat(path)
    if (!details.isFile()) throw new ProjectError(`La ruta gestionada no es un archivo: ${relativePath}`)
    const content = await readFile(path, 'utf8')
    return { content, hash: hashText(content), mode: details.mode & 0o777 }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const normalizeRemote = (value: string): string => {
  const trimmed = value.trim().replace(/\.git$/, '').replace(/\/$/, '')
  const scpLike = trimmed.match(/^git@([^:]+):(.+)$/)
  if (scpLike) return `https://${scpLike[1]}/${scpLike[2]}`.toLowerCase()
  try {
    const url = new URL(trimmed)
    url.username = ''
    url.password = ''
    return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return trimmed.toLowerCase()
  }
}

export const readOriginRemote = (target: string): string | null => {
  const result = spawnSync('git', ['-C', target, 'remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  if (result.status !== 0 || !result.stdout.trim()) return null
  return normalizeRemote(result.stdout)
}

export const assertProjectContext = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
) => {
  for (const required of ['package.json', 'package-lock.json', 'index.html', 'docs/platform/README.md']) {
    if (!(await readProjectFile(target, required))) {
      throw new ProjectError(`El destino no conserva la estructura reconocible: falta ${required}.`)
    }
  }

  const remote = readOriginRemote(target)
  if (remote && remote === normalizeRemote(manifest.canonicalRemote)) {
    throw new ProjectError('El destino conserva el remoto canónico de la plantilla fuente.')
  }
  if (!remote && config.derivation.evidence.trim().length < 12) {
    throw new ProjectError(
      'No se puede comprobar un remoto distinto y la evidencia de copia derivada es insuficiente.',
    )
  }

  const packageFile = await readProjectFile(target, 'package.json')
  if (!packageFile) throw new ProjectError('Falta package.json.')
  let packageJson: { scripts?: Record<string, unknown> }
  try {
    packageJson = JSON.parse(packageFile.content) as { scripts?: Record<string, unknown> }
  } catch {
    throw new ProjectError('package.json no contiene JSON válido.')
  }
  for (const command of config.quality.commands) {
    const match = command.match(/^npm run ([a-zA-Z0-9:_-]+)$/)
    if (!match || typeof packageJson.scripts?.[match[1]] !== 'string') {
      throw new ProjectError(`El comando de calidad no corresponde a un script npm existente: ${command}`)
    }
  }
}

export const readInitializationState = async (
  target: string,
): Promise<InitializationState | null> => {
  const file = await readProjectFile(target, '.template-state.json')
  if (!file) return null
  try {
    const value = JSON.parse(file.content) as InitializationState
    if (
      value.schemaVersion !== 1
      || typeof value.baselineId !== 'string'
      || typeof value.configDigest !== 'string'
      || typeof value.managedFiles !== 'object'
      || value.managedFiles === null
    ) {
      throw new Error('estado incompleto')
    }
    return value
  } catch {
    throw new ProjectError('.template-state.json no contiene un estado válido.')
  }
}

export const listPendingTransactions = async (target: string): Promise<string[]> => {
  const transactionRoot = resolve(target, '.template-transaction')
  try {
    return (await readdir(transactionRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

export const assertNoPendingTransaction = async (target: string) => {
  const pending = await listPendingTransactions(target)
  if (pending.length > 0) {
    throw new ProjectError(
      `Existe una transacción pendiente (${pending.join(', ')}). Ejecute --recover antes de continuar.`,
    )
  }
}

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
