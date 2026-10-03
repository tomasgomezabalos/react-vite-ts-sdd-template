import {
  canonicalJson,
  configDigest,
  effectiveProjectConfig,
  hashText,
  QUALITY_COMMAND,
} from './config.ts'
import { ProjectError, readProjectFile } from './project.ts'
import type {
  BaselineManifest,
  EffectiveProjectConfig,
  FileOperation,
  Preview,
  ProjectConfig,
} from './types.ts'

const TEMPLATE_SCRIPTS = ['template:init', 'template:doctor'] as const
const TEMPLATE_ONLY_START = '<!-- template-only:start -->'
const TEMPLATE_ONLY_END = '<!-- template-only:end -->'

const prettyJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

const htmlText = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const renderReadme = (
  config: EffectiveProjectConfig,
): string => `# ${config.identity.displayName}

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
`

const updatePackageJson = (
  content: string,
  config: EffectiveProjectConfig,
): string => {
  const value = JSON.parse(content) as Record<string, unknown>
  value.name = config.identity.packageName
  value.version = config.identity.packageVersion
  if (typeof value.scripts === 'object' && value.scripts !== null) {
    const scripts = { ...(value.scripts as Record<string, unknown>) }
    for (const name of TEMPLATE_SCRIPTS) delete scripts[name]
    value.scripts = scripts
  }
  return prettyJson(value)
}

export const removeTemplateOnlyBlocks = (content: string): string => {
  const starts = content.split(TEMPLATE_ONLY_START).length - 1
  const ends = content.split(TEMPLATE_ONLY_END).length - 1
  if (starts !== ends) {
    throw new ProjectError(
      'AGENTS.md contiene marcadores template-only desbalanceados.',
    )
  }
  const block = new RegExp(
    `^${TEMPLATE_ONLY_START}\\n[\\s\\S]*?^${TEMPLATE_ONLY_END}\\n`,
    'gm',
  )
  const result = content.replace(block, '')
  if (
    result.includes(TEMPLATE_ONLY_START) ||
    result.includes(TEMPLATE_ONLY_END)
  ) {
    throw new ProjectError(
      'Los marcadores template-only de AGENTS.md deben ocupar su propia línea y estar emparejados.',
    )
  }
  return result
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
    throw new ProjectError(
      'index.html no contiene el marcador gestionado de título.',
    )
  }
  const title = `<title>${htmlText(config.identity.htmlTitle)}</title>`
  return content.replace(/<title>[^<]*<\/title>/, () => title)
}

const loadRequiredContent = async (
  target: string,
  path: string,
): Promise<string> => {
  const file = await readProjectFile(target, path)
  if (!file) throw new ProjectError(`Falta el archivo gestionado ${path}.`)
  return file.content
}

export const renderManagedOutputs = async (
  target: string,
  config: ProjectConfig,
): Promise<Map<string, string>> => {
  const effective = effectiveProjectConfig(config)
  const packageJson = await loadRequiredContent(target, 'package.json')
  const packageLock = await loadRequiredContent(target, 'package-lock.json')
  const indexHtml = await loadRequiredContent(target, 'index.html')
  const agents = await loadRequiredContent(target, 'AGENTS.md')
  return new Map<string, string>([
    ['AGENTS.md', removeTemplateOnlyBlocks(agents)],
    ['package.json', updatePackageJson(packageJson, effective)],
    ['package-lock.json', updatePackageLock(packageLock, effective)],
    ['index.html', updateIndexHtml(indexHtml, effective)],
    ['README.md', renderReadme(effective)],
  ])
}

export const buildPreview = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
): Promise<Preview> => {
  const desired = await renderManagedOutputs(target, config)

  for (const [path, expectedHash] of Object.entries(manifest.managedFiles)) {
    if (desired.has(path)) continue
    const file = await readProjectFile(target, path)
    if (!file || file.hash !== expectedHash) {
      throw new ProjectError(
        `El destino no coincide con la baseline reconocida: ${path}.`,
      )
    }
  }

  const operations: FileOperation[] = []
  for (const [path, content] of [...desired.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const current = await readProjectFile(target, path)
    const afterHash = hashText(content)
    const baselineHash = manifest.managedFiles[path]
    if (!current && baselineHash) {
      throw new ProjectError(
        `El destino no coincide con la baseline reconocida: falta ${path}.`,
      )
    }
    if (
      current &&
      current.hash !== baselineHash &&
      current.hash !== afterHash
    ) {
      throw new ProjectError(
        `El archivo contiene contenido no reconocido (no coincide con la baseline ni con la salida de esta configuración) y no se sobrescribirá: ${path}`,
      )
    }
    let kind: FileOperation['kind']
    if (!current) kind = 'create'
    else if (current.hash === afterHash) kind = 'unchanged'
    else kind = 'modify'
    operations.push({
      kind,
      path,
      beforeHash: current?.hash ?? null,
      afterHash,
      content,
      mode: current?.mode ?? 0o644,
    })
  }

  const digest = configDigest(config)
  const token = hashText(
    canonicalJson({
      schemaVersion: 2,
      baselineId: manifest.baselineId,
      target,
      configDigest: digest,
      operations: operations.map(
        ({ kind, path, beforeHash, afterHash, mode }) => ({
          kind,
          path,
          beforeHash,
          afterHash,
          mode,
        }),
      ),
    }),
  )
  return {
    target,
    configDigest: digest,
    token,
    operations,
    warnings: [],
  }
}
