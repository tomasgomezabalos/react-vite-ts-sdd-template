import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { configDigest } from './config.ts'
import {
  readInitializationState,
  readOriginRemote,
  readProjectFile,
} from './project.ts'
import type {
  BaselineManifest,
  Diagnostic,
  InitializationState,
  ProjectConfig,
} from './types.ts'

const result = (
  code: string,
  status: Diagnostic['status'],
  message: string,
  path?: string,
  limitation?: string,
): Diagnostic => ({ code, status, message, ...(path ? { path } : {}), ...(limitation ? { limitation } : {}) })

const readJson = async <T>(target: string, path: string): Promise<T | null> => {
  const file = await readProjectFile(target, path)
  if (!file) return null
  try {
    return JSON.parse(file.content) as T
  } catch {
    return null
  }
}

const parseNodeVersion = (value: string): [number, number, number] | null => {
  const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/)
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3])]
    : null
}

const compareNodeVersions = (
  left: [number, number, number],
  right: [number, number, number],
): number => {
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) > (right[index] ?? 0)) return 1
    if ((left[index] ?? 0) < (right[index] ?? 0)) return -1
  }
  return 0
}

export const satisfiesNodeRange = (version: string, range: string): boolean => {
  const current = parseNodeVersion(version)
  if (!current) return false
  const exact = parseNodeVersion(range)
  if (exact) return compareNodeVersions(current, exact) === 0
  const match = range.trim().match(/^>=\s*(\d+\.\d+\.\d+)(?:\s+<\s*(\d+(?:\.\d+\.\d+)?))?$/)
  if (!match) return false
  const minimum = parseNodeVersion(match[1] ?? '')
  const maximumText = match[2]
  const maximum = maximumText
    ? parseNodeVersion(maximumText.includes('.') ? maximumText : `${maximumText}.0.0`)
    : null
  return Boolean(
    minimum
    && compareNodeVersions(current, minimum) >= 0
    && (!maximum || compareNodeVersions(current, maximum) < 0),
  )
}

const walkNames = async (target: string, relativePath = ''): Promise<string[]> => {
  const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.template-transaction'])
  const entries = await readdir(resolve(target, relativePath), { withFileTypes: true })
  const names: string[] = []
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue
    const child = relativePath ? `${relativePath}/${entry.name}` : entry.name
    if (entry.isDirectory()) names.push(...await walkNames(target, child))
    else names.push(child)
  }
  return names
}

const pendingPaths = (value: unknown, path = '$'): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => pendingPaths(entry, `${path}[${index}]`))
  }
  if (typeof value !== 'object' || value === null) return []
  if ('status' in value && value.status === 'pending') return [path]
  return Object.entries(value).flatMap(([key, entry]) => pendingPaths(entry, `${path}.${key}`))
}

export const runDiagnostics = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
): Promise<Diagnostic[]> => {
  const diagnostics: Diagnostic[] = []
  const packageJson = await readJson<{
    name?: string
    version?: string
    engines?: { node?: string }
    scripts?: Record<string, string>
  }>(target, 'package.json')
  const packageLock = await readJson<{
    name?: string
    version?: string
    packages?: Record<string, { name?: string; version?: string }>
  }>(target, 'package-lock.json')
  if (!packageJson || !packageLock) {
    diagnostics.push(result('PACKAGE_READABLE', 'FAIL', 'No se pueden leer package.json y package-lock.json como JSON válido.'))
  } else {
    const rootLock = packageLock.packages?.['']
    const coherent = packageJson.name === config.identity.packageName
      && packageJson.version === config.identity.packageVersion
      && packageJson.name === packageLock.name
      && packageJson.name === rootLock?.name
      && packageJson.version === packageLock.version
      && packageJson.version === rootLock?.version
    diagnostics.push(result(
      'PACKAGE_IDENTITY',
      coherent ? 'PASS' : 'FAIL',
      coherent ? 'Nombre y versión son coherentes entre manifiesto y lockfile.' : 'Nombre o versión difieren entre package.json y package-lock.json.',
      'package.json',
    ))
    const commandsMissing = config.quality.commands.filter((command) => {
      const match = command.match(/^npm run ([a-zA-Z0-9:_-]+)$/)
      return !match || typeof packageJson.scripts?.[match[1]] !== 'string'
    })
    diagnostics.push(result(
      'QUALITY_COMMANDS',
      commandsMissing.length === 0 ? 'PASS' : 'FAIL',
      commandsMissing.length === 0
        ? 'Todos los comandos de calidad declarados existen.'
        : `Comandos no disponibles: ${commandsMissing.join(', ')}.`,
      'package.json',
    ))
  }

  const indexHtml = await readProjectFile(target, 'index.html')
  const titleOk = indexHtml?.content.includes(`<title>${config.identity.htmlTitle.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</title>`) ?? false
  const langOk = indexHtml?.content.includes(`<html lang="${config.localization.htmlLanguage.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`) ?? false
  diagnostics.push(result(
    'HTML_IDENTITY',
    titleOk && langOk ? 'PASS' : 'FAIL',
    titleOk && langOk ? 'Título e idioma HTML coinciden con la configuración.' : 'Título o idioma HTML no coinciden con la configuración.',
    'index.html',
  ))

  const resources = await readProjectFile(target, 'src/i18n/resources.ts')
  const i18nConfig = await readProjectFile(target, 'src/i18n/config.ts')
  const localizationOk = resources?.content.includes(`defaultLanguage = ${JSON.stringify(config.localization.defaultLanguage)}`)
    && resources.content.includes(`fallbackLanguage = ${JSON.stringify(config.localization.fallbackLanguage)}`)
    && i18nConfig?.content.includes('fallbackLng: fallbackLanguage,')
  diagnostics.push(result(
    'I18N_CONFIGURATION',
    localizationOk ? 'PASS' : 'FAIL',
    localizationOk ? 'Los idiomas predeterminado y fallback coinciden.' : 'La configuración i18n no coincide con el manifiesto.',
    'src/i18n/resources.ts',
  ))

  const nvmrc = await readProjectFile(target, '.nvmrc')
  const declaredNode = packageJson?.engines?.node
  if (!nvmrc || !declaredNode) {
    diagnostics.push(result('NODE_VERSION', 'FAIL', 'Falta la versión Node en .nvmrc o package.json.'))
  } else {
    const nvmVersion = nvmrc.content.trim()
    const declarationsMatch = satisfiesNodeRange(nvmVersion, declaredNode)
    const effectiveOk = satisfiesNodeRange(process.version, declaredNode)
    diagnostics.push(result(
      'NODE_VERSION',
      declarationsMatch && effectiveOk ? 'PASS' : 'FAIL',
      declarationsMatch && effectiveOk
        ? `Node efectivo ${process.version} cumple la versión declarada ${declaredNode}.`
        : `Node efectivo ${process.version}, .nvmrc ${nvmVersion} y engines ${declaredNode} no son coherentes.`,
      '.nvmrc',
    ))
  }

  const vision = await readProjectFile(target, 'specs/product-vision.md')
  if (!vision) {
    diagnostics.push(result('PRODUCT_VISION', 'FAIL', 'Falta la visión de producto.', 'specs/product-vision.md'))
  } else if (vision.content.includes('**Estado documental:** DRAFT')) {
    diagnostics.push(result('PRODUCT_VISION', 'WARN', 'La visión existe pero continúa en DRAFT.', 'specs/product-vision.md'))
  } else if (vision.content.includes('**Estado documental:** APPROVED')) {
    diagnostics.push(result('PRODUCT_VISION', 'PASS', 'La visión de producto está aprobada.', 'specs/product-vision.md'))
  } else {
    diagnostics.push(result('PRODUCT_VISION', 'FAIL', 'La visión no declara un estado documental reconocido.', 'specs/product-vision.md'))
  }

  const legacyRootPaths = [
    'specs/001-enrutamiento-base-spa',
    'specs/002-carga-diferida-rutas',
  ]
  const legacyPresent = (await Promise.all(legacyRootPaths.map(async (path) =>
    (await readProjectFile(target, `${path}/spec.md`)) !== null))).some(Boolean)
  const platformIndex = await readProjectFile(target, 'docs/platform/README.md')
  diagnostics.push(result(
    'SDD_SEPARATION',
    !legacyPresent && Boolean(platformIndex) ? 'PASS' : 'FAIL',
    !legacyPresent && platformIndex
      ? 'La documentación de plataforma y producto está separada.'
      : 'La separación entre plataforma y producto no coincide con ADR-0010.',
    'specs',
  ))

  const viteConfig = await readProjectFile(target, 'vite.config.ts')
  const readme = await readProjectFile(target, 'README.md')
  const deploymentOk = viteConfig?.content.includes(`base: ${JSON.stringify(config.deployment.basePath)},`)
    && readme?.content.includes(`Ruta base: \`${config.deployment.basePath}\``)
    && readme.content.includes('Fallback SPA:')
  diagnostics.push(result(
    'DEPLOYMENT_DECISIONS',
    deploymentOk ? 'PASS' : 'FAIL',
    deploymentOk ? 'Ruta base y fallback SPA están declarados.' : 'Falta coherencia en las decisiones de despliegue.',
    'vite.config.ts',
  ))

  const envExample = await readProjectFile(target, '.env.example')
  const envNames = envExample?.content.split('\n').filter(Boolean).map((line) => line.split('=', 1)[0]).sort() ?? []
  const expectedEnv = [...config.environments.publicVariables].sort()
  const environmentOk = Boolean(envExample)
    && JSON.stringify(envNames) === JSON.stringify(expectedEnv)
  diagnostics.push(result(
    'PUBLIC_ENVIRONMENT',
    environmentOk ? 'PASS' : 'FAIL',
    environmentOk
      ? 'Las variables públicas coinciden con la configuración.'
      : 'Falta .env.example o sus variables no coinciden con la configuración.',
    '.env.example',
  ))

  const names = await walkNames(target)
  const secretNamePattern = /(^|\/)(?:\.env(?:\..+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i
  const allowed = new Set(['.env.example'])
  const secretCandidates = names.filter((path) => secretNamePattern.test(path) && !allowed.has(path))
  diagnostics.push(result(
    'KNOWN_SECRET_FILES',
    secretCandidates.length === 0 ? 'PASS' : 'FAIL',
    secretCandidates.length === 0
      ? 'No se detectaron nombres de archivos secretos conocidos.'
      : `Archivos potencialmente sensibles: ${secretCandidates.join(', ')}.`,
    undefined,
    'Solo se comprueban nombres y patrones conocidos; este resultado no demuestra ausencia de secretos ni vulnerabilidades.',
  ))

  const placeholderFiles = ['package.json', 'package-lock.json', 'index.html', 'README.md', 'specs/README.md']
  const residuals: string[] = []
  for (const path of placeholderFiles) {
    const file = await readProjectFile(target, path)
    if (file && /react-vite-ts-sdd-template|<nombre>|<AAAA-MM-DD>/i.test(file.content)) {
      residuals.push(path)
    }
  }
  diagnostics.push(result(
    'TEMPLATE_RESIDUALS',
    residuals.length === 0 ? 'PASS' : 'FAIL',
    residuals.length === 0 ? 'No se detectaron identificadores residuales conocidos.' : `Persisten identificadores de plantilla en: ${residuals.join(', ')}.`,
    undefined,
    'La comprobación se limita a patrones y archivos declarados por la baseline.',
  ))

  let state: InitializationState | null
  let stateError: string | null = null
  try {
    state = await readInitializationState(target)
  } catch (error) {
    stateError = error instanceof Error ? error.message : String(error)
    state = null
  }
  if (stateError) {
    diagnostics.push(result(
      'INITIALIZATION_STATE',
      'FAIL',
      `El estado de inicialización no es legible: ${stateError}`,
      '.template-state.json',
    ))
  } else if (!state) {
    diagnostics.push(result('INITIALIZATION_STATE', 'FAIL', 'Falta .template-state.json.', '.template-state.json'))
  } else {
    const mismatches: string[] = []
    for (const [path, expectedHash] of Object.entries(state.managedFiles)) {
      const file = await readProjectFile(target, path)
      if ((file?.hash ?? null) !== expectedHash) mismatches.push(path)
    }
    const stateOk = state.baselineId === manifest.baselineId
      && state.configDigest === configDigest(config)
      && mismatches.length === 0
    diagnostics.push(result(
      'INITIALIZATION_STATE',
      stateOk ? 'PASS' : 'FAIL',
      stateOk ? 'El estado de inicialización coincide con configuración y archivos.' : `El estado no coincide${mismatches.length > 0 ? `: ${mismatches.join(', ')}` : '.'}`,
      '.template-state.json',
    ))
  }

  const remote = readOriginRemote(target)
  diagnostics.push(result(
    'SOURCE_REMOTE',
    remote === null ? 'UNKNOWN' : remote === manifest.canonicalRemote.replace(/\.git$/, '').toLowerCase() ? 'FAIL' : 'PASS',
    remote === null
      ? 'No se pudo observar el remoto origin.'
      : remote === manifest.canonicalRemote.replace(/\.git$/, '').toLowerCase()
        ? 'El proyecto conserva el remoto canónico de la plantilla.'
        : 'El remoto origin es distinto del origen de la plantilla.',
    undefined,
    remote === null ? 'La ausencia de remoto observable se complementa con la evidencia declarada en la configuración.' : undefined,
  ))

  for (const path of pendingPaths(config)) {
    diagnostics.push(result('PENDING_DECISION', 'WARN', `Decisión pendiente: ${path}.`))
  }
  return diagnostics.sort((left, right) => left.code.localeCompare(right.code) || (left.path ?? '').localeCompare(right.path ?? ''))
}
