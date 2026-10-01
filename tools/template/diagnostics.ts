import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  effectiveProjectConfig,
  QUALITY_COMMAND,
} from './config.ts'
import { renderManagedOutputs } from './managed-files.ts'
import {
  readOriginRemote,
  readProjectFile,
} from './project.ts'
import type {
  BaselineManifest,
  Diagnostic,
  ProjectConfig,
} from './types.ts'

const result = (
  code: string,
  status: Diagnostic['status'],
  message: string,
  path?: string,
  limitation?: string,
): Diagnostic => ({
  code,
  status,
  message,
  ...(path ? { path } : {}),
  ...(limitation ? { limitation } : {}),
})

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

const htmlText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const canonicalRemote = (value: string): string =>
  value.trim().replace(/\.git$/, '').replace(/\/$/, '').toLowerCase()

export const runDiagnostics = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
): Promise<Diagnostic[]> => {
  const diagnostics: Diagnostic[] = []
  const effective = effectiveProjectConfig(config)
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
    diagnostics.push(result(
      'PACKAGE_READABLE',
      'FAIL',
      'No se pueden leer package.json y package-lock.json como JSON válido.',
    ))
  } else {
    const rootLock = packageLock.packages?.['']
    const coherent = packageJson.name === effective.identity.packageName
      && packageJson.version === effective.identity.packageVersion
      && packageJson.name === packageLock.name
      && packageJson.name === rootLock?.name
      && packageJson.version === packageLock.version
      && packageJson.version === rootLock?.version
    diagnostics.push(result(
      'PACKAGE_IDENTITY',
      coherent ? 'PASS' : 'FAIL',
      coherent
        ? 'Nombre y versión son coherentes entre manifiesto y lockfile.'
        : 'Nombre o versión difieren entre package.json y package-lock.json.',
      'package.json',
    ))
    const qualityOk = typeof packageJson.scripts?.check === 'string'
    diagnostics.push(result(
      'QUALITY_COMMANDS',
      qualityOk ? 'PASS' : 'FAIL',
      qualityOk
        ? `El comando de calidad heredado está disponible: ${QUALITY_COMMAND}.`
        : `Falta el comando de calidad heredado: ${QUALITY_COMMAND}.`,
      'package.json',
    ))
  }

  const indexHtml = await readProjectFile(target, 'index.html')
  const titleOk = indexHtml?.content.includes(
    `<title>${htmlText(effective.identity.htmlTitle)}</title>`,
  ) ?? false
  const langOk = /<html\s+lang="[A-Za-z0-9-]+">/.test(indexHtml?.content ?? '')
  diagnostics.push(result(
    'HTML_IDENTITY',
    titleOk && langOk ? 'PASS' : 'FAIL',
    titleOk && langOk
      ? 'El título derivado y el idioma HTML estructural son válidos.'
      : 'El título derivado o el idioma HTML no son válidos.',
    'index.html',
  ))

  const resources = await readProjectFile(target, 'src/i18n/resources.ts')
  const i18nConfig = await readProjectFile(target, 'src/i18n/config.ts')
  const defaultLanguage = resources?.content.match(
    /export const defaultLanguage = ['"]([A-Za-z0-9-]+)['"]/,
  )?.[1]
  const localeResource = defaultLanguage
    ? await readProjectFile(target, `src/locales/${defaultLanguage}/common.json`)
    : null
  const localizationOk = Boolean(
    defaultLanguage
    && localeResource
    && resources?.content.includes(`${defaultLanguage}: {`)
    && i18nConfig?.content.includes('fallbackLng: defaultLanguage,'),
  )
  diagnostics.push(result(
    'I18N_CONFIGURATION',
    localizationOk ? 'PASS' : 'FAIL',
    localizationOk
      ? 'La configuración i18n heredada conserva un idioma y recursos coherentes.'
      : 'La configuración i18n heredada no es estructuralmente coherente.',
    'src/i18n/resources.ts',
  ))

  const nvmrc = await readProjectFile(target, '.nvmrc')
  const declaredNode = packageJson?.engines?.node
  if (!nvmrc || !declaredNode) {
    diagnostics.push(result(
      'NODE_VERSION',
      'FAIL',
      'Falta la versión Node en .nvmrc o package.json.',
    ))
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

  const envExample = await readProjectFile(target, '.env.example')
  if (envExample) {
    const invalidNames = envExample.content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split('=', 1)[0] ?? '')
      .filter((name) => !/^VITE_[A-Z][A-Z0-9_]*$/.test(name)
        || /(?:password|passwd|secret|token|credential|private.?key|api.?key)/i.test(name))
    diagnostics.push(result(
      'PUBLIC_ENVIRONMENT',
      invalidNames.length === 0 ? 'PASS' : 'FAIL',
      invalidNames.length === 0
        ? 'Las variables públicas declaradas tienen nombres compatibles.'
        : `Variables públicas inválidas o sensibles: ${invalidNames.join(', ')}.`,
      '.env.example',
    ))
  }

  const names = await walkNames(target)
  const secretNamePattern = /(^|\/)(?:\.env(?:\..+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i
  const allowed = new Set(['.env.example'])
  const secretCandidates = names.filter((path) =>
    secretNamePattern.test(path) && !allowed.has(path))
  diagnostics.push(result(
    'KNOWN_SECRET_FILES',
    secretCandidates.length === 0 ? 'PASS' : 'FAIL',
    secretCandidates.length === 0
      ? 'No se detectaron nombres de archivos secretos conocidos.'
      : `Archivos potencialmente sensibles: ${secretCandidates.join(', ')}.`,
    undefined,
    'Solo se comprueban nombres y patrones conocidos; este resultado no demuestra ausencia de secretos ni vulnerabilidades.',
  ))

  const placeholderFiles = [
    'package.json',
    'package-lock.json',
    'index.html',
    'README.md',
  ]
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
    residuals.length === 0
      ? 'No se detectaron identificadores residuales conocidos.'
      : `Persisten identificadores de plantilla en: ${residuals.join(', ')}.`,
    undefined,
    'La comprobación se limita a patrones y archivos declarados por la baseline.',
  ))

  let outputsError: string | null = null
  const mismatches: string[] = []
  try {
    const outputs = await renderManagedOutputs(target, config)
    for (const [path, expected] of outputs) {
      const file = await readProjectFile(target, path)
      if (file?.content !== expected) mismatches.push(path)
    }
  } catch (error) {
    outputsError = error instanceof Error ? error.message : String(error)
  }
  diagnostics.push(result(
    'MANAGED_OUTPUTS',
    outputsError === null && mismatches.length === 0 ? 'PASS' : 'FAIL',
    outputsError !== null
      ? `No se pueden comprobar las salidas gestionadas: ${outputsError}`
      : mismatches.length === 0
        ? 'Las salidas gestionadas coinciden con la configuración suministrada.'
        : `Las salidas gestionadas no coinciden con la configuración: ${mismatches.join(', ')}.`,
    undefined,
    'Se comprueba la derivación recién aplicada; un proyecto que ya evolucionó puede diferir legítimamente.',
  ))

  const remote = readOriginRemote(target)
  const sourceRemote = canonicalRemote(manifest.canonicalRemote)
  diagnostics.push(result(
    'SOURCE_REMOTE',
    remote === null ? 'UNKNOWN' : remote === sourceRemote ? 'FAIL' : 'PASS',
    remote === null
      ? 'No se pudo observar el remoto origin.'
      : remote === sourceRemote
        ? 'El proyecto conserva el remoto canónico de la plantilla.'
        : 'El remoto origin es distinto del origen de la plantilla.',
    undefined,
    remote === null
      ? 'Sin remoto observable, la procedencia se limita al fingerprint local de baseline y a las salidas gestionadas.'
      : undefined,
  ))

  return diagnostics.sort((left, right) =>
    left.code.localeCompare(right.code)
      || (left.path ?? '').localeCompare(right.path ?? ''))
}
