import {
  canonicalJson,
  configDigest,
  effectiveProjectConfig,
  hashText,
  QUALITY_COMMAND,
} from './config.ts'
import {
  ProjectError,
  readInitializationState,
  readProjectFile,
} from './project.ts'
import type {
  BaselineManifest,
  EffectiveProjectConfig,
  FileOperation,
  InitializationState,
  Preview,
  ProjectConfig,
} from './types.ts'

const prettyJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const htmlText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderReadme = (config: EffectiveProjectConfig): string => `# ${config.identity.displayName}

SPA cliente creada a partir de una baseline React, Vite y TypeScript gobernada por SDD.

## Puesta en marcha

Requiere la versión Node indicada en \`.nvmrc\`.

\`\`\`bash
nvm use
npm ci
npm run dev
\`\`\`

Puerta de calidad:

- \`${QUALITY_COMMAND}\`

## Plataforma y documentación

- [Índice de producto](specs/README.md)
- [Contrato de plataforma](docs/platform/README.md)
- [Flujo SDD](docs/sdd/README.md)
- [Decisiones arquitectónicas](docs/architecture/README.md)

El proyecto arranca sin visión ni features de producto artificiales. Cuando exista una necesidad real, el descubrimiento y las decisiones correspondientes se documentan mediante el flujo SDD.

La arquitectura heredada es una SPA renderizada en cliente. Una necesidad confirmada de SSR, SSG, React Server Components, backend o rutas de servidor exige revisar la idoneidad y aprobar otra decisión antes de implementarla.

## Diagnóstico de la derivación

\`npm run template:doctor -- --target . --config project.config.json\` inspecciona la coherencia técnica local sin corregir archivos. Sus comprobaciones de secretos y seguridad son limitadas y no sustituyen una auditoría.
`

const updatePackageJson = (
  content: string,
  config: EffectiveProjectConfig,
): string => {
  const value = JSON.parse(content) as Record<string, unknown>
  value.name = config.identity.packageName
  value.version = config.identity.packageVersion
  return prettyJson(value)
}

const updatePackageLock = (
  content: string,
  config: EffectiveProjectConfig,
): string => {
  const value = JSON.parse(content) as {
    name?: string
    version?: string
    packages?: Record<string, Record<string, unknown>>
  }
  value.name = config.identity.packageName
  value.version = config.identity.packageVersion
  if (!value.packages?.['']) {
    throw new ProjectError('package-lock.json no contiene el paquete raíz.')
  }
  value.packages[''].name = config.identity.packageName
  value.packages[''].version = config.identity.packageVersion
  return prettyJson(value)
}

const updateIndexHtml = (
  content: string,
  config: EffectiveProjectConfig,
): string => {
  if (!/<title>[^<]*<\/title>/.test(content)) {
    throw new ProjectError('index.html no contiene el marcador gestionado de título.')
  }
  return content.replace(
    /<title>[^<]*<\/title>/,
    `<title>${htmlText(config.identity.htmlTitle)}</title>`,
  )
}

const loadRequiredContent = async (target: string, path: string): Promise<string> => {
  const file = await readProjectFile(target, path)
  if (!file) throw new ProjectError(`Falta el archivo gestionado ${path}.`)
  return file.content
}

const renderDesiredFiles = async (
  target: string,
  config: ProjectConfig,
): Promise<Map<string, string | null>> => {
  const effective = effectiveProjectConfig(config)
  const packageJson = await loadRequiredContent(target, 'package.json')
  const packageLock = await loadRequiredContent(target, 'package-lock.json')
  const indexHtml = await loadRequiredContent(target, 'index.html')
  return new Map<string, string | null>([
    ['package.json', updatePackageJson(packageJson, effective)],
    ['package-lock.json', updatePackageLock(packageLock, effective)],
    ['index.html', updateIndexHtml(indexHtml, effective)],
    ['README.md', renderReadme(effective)],
  ])
}

const stateContent = (
  config: ProjectConfig,
  manifest: BaselineManifest,
  desired: Map<string, string | null>,
): string => {
  const managedFiles = Object.fromEntries([...desired.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]) => [path, content === null ? null : hashText(content)]))
  const state: InitializationState = {
    schemaVersion: 2,
    baselineId: manifest.baselineId,
    configDigest: configDigest(config),
    managedFiles,
  }
  return prettyJson(state)
}

const assertExistingState = async (
  target: string,
  state: InitializationState,
  config: ProjectConfig,
  manifest: BaselineManifest,
) => {
  if (state.baselineId !== manifest.baselineId) {
    throw new ProjectError('El proyecto fue inicializado con otra baseline.')
  }
  if (state.configDigest !== configDigest(config)) {
    throw new ProjectError('El proyecto ya fue inicializado con una configuración diferente.')
  }
  for (const [path, expectedHash] of Object.entries(state.managedFiles)) {
    const current = await readProjectFile(target, path)
    if ((current?.hash ?? null) !== expectedHash) {
      throw new ProjectError(`El archivo inicializado fue modificado y no se sobrescribirá: ${path}`)
    }
  }
}

export const buildPreview = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
): Promise<Preview> => {
  const existingState = await readInitializationState(target)
  if (existingState) await assertExistingState(target, existingState, config, manifest)

  const desired = await renderDesiredFiles(target, config)
  desired.set('.template-state.json', stateContent(config, manifest, desired))

  const operations: FileOperation[] = []
  for (const [path, content] of [...desired.entries()].sort(([left], [right]) =>
    left.localeCompare(right))) {
    const current = await readProjectFile(target, path)
    const afterHash = content === null ? null : hashText(content)
    if (!existingState && current) {
      const baselineHash = manifest.managedFiles[path]
      if (!baselineHash || current.hash !== baselineHash) {
        throw new ProjectError(`El archivo contiene contenido no reconocido y no se sobrescribirá: ${path}`)
      }
    }
    let kind: FileOperation['kind']
    if (!current && content !== null) kind = 'create'
    else if (current && content === null) kind = 'delete'
    else if ((current?.hash ?? null) === afterHash) kind = 'unchanged'
    else kind = 'modify'
    operations.push({
      kind,
      path,
      beforeHash: current?.hash ?? null,
      afterHash,
      content: content ?? undefined,
      mode: current?.mode ?? 0o644,
    })
  }

  const digest = configDigest(config)
  const token = hashText(canonicalJson({
    schemaVersion: 2,
    baselineId: manifest.baselineId,
    target,
    configDigest: digest,
    operations: operations.map(({ kind, path, beforeHash, afterHash, mode }) => ({
      kind,
      path,
      beforeHash,
      afterHash,
      mode,
    })),
  }))
  return {
    target,
    configDigest: digest,
    token,
    operations,
    warnings: [],
  }
}
