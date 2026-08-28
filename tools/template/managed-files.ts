import { readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import {
  canonicalJson,
  configDigest,
  hashText,
} from './config.ts'
import {
  ProjectError,
  readInitializationState,
  readProjectFile,
} from './project.ts'
import type {
  BaselineManifest,
  FileOperation,
  InitializationState,
  PendingValue,
  Preview,
  ProjectConfig,
  ResolvedOrPending,
} from './types.ts'

const prettyJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const markdownValue = (value: ResolvedOrPending): string => {
  if (typeof value === 'string') return value
  return `Pendiente — responsable: ${value.responsible}; condición: ${value.resolutionCondition}`
}

const markdownList = (values: string[], empty: string): string =>
  values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : `- ${empty}`

const markdownCell = (value: ResolvedOrPending): string =>
  markdownValue(value).replaceAll('|', '\\|').replaceAll('\n', '<br>')

const htmlAttribute = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const htmlText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderResources = (config: ProjectConfig): string => {
  const locales = Object.keys(config.localization.resources).sort()
  const imports = locales.map((locale, index) =>
    `import common${index} from '../locales/${locale}/common.json'`).join('\n')
  const entries = locales.map((locale, index) => [
    `  ${JSON.stringify(locale)}: {`,
    `    common: common${index},`,
    '  },',
  ].join('\n')).join('\n')
  return `${imports}\n\nexport const defaultLanguage = ${JSON.stringify(config.localization.defaultLanguage)}\nexport const fallbackLanguage = ${JSON.stringify(config.localization.fallbackLanguage)}\nexport const defaultNamespace = 'common'\n\nexport const resources = {\n${entries}\n} as const\n`
}

const renderRouteLoadingTest = (loadingText: string): string => `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteLoading } from '../../../src/app/RouteLoading'

describe('RouteLoading', () => {
  it('announces that the page is loading in the active language', () => {
    render(<RouteLoading />)

    expect(screen.getByRole('status')).toHaveTextContent(${JSON.stringify(loadingText)})
  })
})
`

const renderAppTest = (loadingText: string): string => `import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../../src/app/App'

const homeModule = vi.hoisted(() => {
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolvePending) => {
    release = resolvePending
  })

  return { pending, resolve: () => release?.() }
})

vi.mock('../../../src/pages/Home', async () => {
  await homeModule.pending
  return vi.importActual('../../../src/pages/Home')
})

describe('App', () => {
  it('renders the route fallback before the empty home page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent(${JSON.stringify(loadingText)})

    homeModule.resolve()

    await waitForElementToBeRemoved(() => screen.getByRole('status'))

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders no route content for an unmatched URL', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
`

const renderProductVision = (config: ProjectConfig): string => {
  const vision = config.productVision
  const metrics = vision.metrics.map((metric) =>
    `| ${markdownCell(metric.metric)} | ${markdownCell(metric.baseline)} | ${markdownCell(metric.target)} | ${markdownCell(metric.measurement)} |`).join('\n')
  const questions = vision.openQuestions.length > 0
    ? vision.openQuestions.map((question) =>
      `- Abierta: ${question.question} Responsable: ${question.responsible}. Condición: ${question.resolutionCondition}`).join('\n')
    : '- Ninguna cuestión abierta registrada.'
  return `# Visión de producto — ${config.identity.displayName}

**Estado documental:** DRAFT

**Versión:** 0.1.0

**Fecha:** ${vision.documentDate}

**Aprobado por:** Pendiente

**Fecha de aprobación:** Pendiente

**Evidencia de aprobación:** Pendiente

## Problema y contexto

${vision.problemAndContext}

## Personas usuarias y partes interesadas

${markdownList(vision.users, 'Pendiente de identificar con responsable.')}

## Resultados y objetivos

${markdownList(vision.outcomes, 'Pendiente de definir con responsable.')}

## Límites del producto

### Incluido

${markdownList(vision.included, 'Ninguna capacidad incluida.')}

### Excluido

${markdownList(vision.excluded, 'Ningún límite adicional confirmado.')}

## Métricas de éxito

| Métrica | Situación inicial | Objetivo | Método de medición |
| --- | --- | --- | --- |
${metrics}

## Restricciones y supuestos

${markdownList(vision.constraints.map((value) => `Restricción: ${value}`), 'Ninguna restricción confirmada.')}
${markdownList(vision.assumptions.map((value) => `Supuesto: ${value}`), 'Ningún supuesto registrado.')}

## Perfil transversal del proyecto

- Accesibilidad: ${markdownValue(vision.accessibility)}
- Navegadores y dispositivos: ${markdownValue(config.support.browsersAndDevices)}
- Responsive: ${markdownValue(vision.responsive)}
- Internacionalización: idioma predeterminado ${config.localization.defaultLanguage}; fallback ${config.localization.fallbackLanguage}; documento ${config.localization.htmlLanguage}.
- Seguridad y privacidad: ${markdownValue(vision.securityAndPrivacy)} ${config.environments.secretsPolicy}
- Rendimiento: ${markdownValue(vision.performance)}
- Observabilidad: ${markdownValue(vision.observability)}
- Despliegue: ${markdownValue(config.deployment.hosting)} Base ${config.deployment.basePath}. Fallback SPA: ${markdownValue(config.deployment.spaFallback)}

Los valores pendientes deben resolverse antes de implementar la primera feature a la que afecten. No se inventan requisitos universales para completar esta sección.

## Riesgos y cuestiones abiertas

${markdownList(vision.risks.map((value) => `Riesgo: ${value}`), 'Ningún riesgo adicional registrado.')}
${questions}

## Puerta documental

La aprobación de la visión permite utilizarla como contexto para especificaciones posteriores. No aprueba ninguna feature, decisión técnica, implementación ni publicación.
`
}

const renderReadme = (config: ProjectConfig): string => `# ${config.identity.displayName}

${config.productVision.problemAndContext}

## Estado inicial

Este proyecto deriva de la baseline React, Vite y TypeScript para SPA cliente. La [visión de producto](specs/product-vision.md) permanece en \`DRAFT\` hasta su aprobación expresa; ninguna feature queda autorizada por la inicialización.

## Puesta en marcha

Requiere la versión Node indicada en \`.nvmrc\`.

\`\`\`bash
nvm use
npm ci
npm run dev
\`\`\`

Puerta de calidad declarada:

${config.quality.commands.map((command) => `- \`${command}\``).join('\n')}

## Plataforma y documentación

- [Índice de producto](specs/README.md)
- [Contrato de plataforma](docs/platform/README.md)
- [Flujo SDD](docs/sdd/README.md)
- [Decisiones arquitectónicas](docs/architecture/README.md)

El producto es una SPA renderizada en cliente. Cualquier necesidad posterior de SSR, SSG, React Server Components o rutas de servidor requiere revisar la idoneidad y aprobar otra decisión antes de implementarla.

## Internacionalización

- Idioma predeterminado: \`${config.localization.defaultLanguage}\`.
- Fallback: \`${config.localization.fallbackLanguage}\`.
- Idioma del documento: \`${config.localization.htmlLanguage}\`.

## Entornos y despliegue

- Entornos: ${config.environments.names.join(', ')}.
- Variables públicas permitidas: ${config.environments.publicVariables.length > 0 ? config.environments.publicVariables.map((value) => `\`${value}\``).join(', ') : 'ninguna declarada'}.
- Política de secretos: ${config.environments.secretsPolicy}
- Alojamiento: ${markdownValue(config.deployment.hosting)}
- Ruta base: \`${config.deployment.basePath}\`.
- Fallback SPA: ${markdownValue(config.deployment.spaFallback)}

## Repositorio

- URL: ${markdownValue(config.repository.url)}
- Visibilidad: ${markdownValue(config.repository.visibility)}
- Licencia: ${markdownValue(config.repository.license)}
- Historial: ${markdownValue(config.repository.historyStrategy)}

## Diagnóstico de la derivación

\`npm run template:doctor -- --target . --config project.config.json\` inspecciona la coherencia local sin corregir archivos. Sus comprobaciones de secretos y seguridad son limitadas y no sustituyen una auditoría.
`

const renderSpecsIndex = (): string => `# Especificaciones

Este directorio contiene la visión, las features, los cambios y los informes de validación del producto derivado.

## Contexto de producto

- [Visión de producto](product-vision.md) — \`DRAFT 0.1.0\` hasta aprobación expresa.

La primera feature \`FULL\` podrá comenzar en \`specs/001-nombre-feature/\` y utilizar el identificador \`FEAT-001\`, siguiendo la clasificación y las plantillas indicadas en \`docs/sdd/README.md\`.

Las decisiones y especificaciones heredadas de la baseline viven en \`docs/platform/\`. Los artefactos nuevos utilizan estado documental y registran la entrega separadamente conforme a ADR-0009.
`

const collectPending = (value: unknown, path = '$'): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectPending(entry, `${path}[${index}]`))
  }
  if (typeof value !== 'object' || value === null) return []
  if ('status' in value && value.status === 'pending') return [path]
  return Object.entries(value).flatMap(([key, entry]) => collectPending(entry, `${path}.${key}`))
}

const updatePackageJson = (content: string, config: ProjectConfig): string => {
  const value = JSON.parse(content) as Record<string, unknown>
  value.name = config.identity.packageName
  value.version = config.identity.packageVersion
  return prettyJson(value)
}

const updatePackageLock = (content: string, config: ProjectConfig): string => {
  const value = JSON.parse(content) as {
    name?: string
    version?: string
    packages?: Record<string, Record<string, unknown>>
  }
  value.name = config.identity.packageName
  value.version = config.identity.packageVersion
  if (!value.packages?.['']) throw new ProjectError('package-lock.json no contiene el paquete raíz.')
  value.packages[''].name = config.identity.packageName
  value.packages[''].version = config.identity.packageVersion
  return prettyJson(value)
}

const updateIndexHtml = (content: string, config: ProjectConfig): string => {
  if (!/<html lang="[^"]*">/.test(content) || !/<title>[^<]*<\/title>/.test(content)) {
    throw new ProjectError('index.html no contiene los marcadores gestionados de idioma y título.')
  }
  return content
    .replace(/<html lang="[^"]*">/, `<html lang="${htmlAttribute(config.localization.htmlLanguage)}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${htmlText(config.identity.htmlTitle)}</title>`)
}

const updateViteConfig = (content: string, config: ProjectConfig): string => {
  const baseLine = `    base: ${JSON.stringify(config.deployment.basePath)},`
  if (/^\s{4}base: .*,$/m.test(content)) {
    return content.replace(/^\s{4}base: .*,$/m, baseLine)
  }
  if (!content.includes('  return {\n')) {
    throw new ProjectError('vite.config.ts no contiene el punto de inserción gestionado.')
  }
  return content.replace('  return {\n', `  return {\n${baseLine}\n`)
}

const updateI18nConfig = (content: string): string => {
  let updated = content
  if (!updated.includes('  fallbackLanguage,\n')) {
    updated = updated.replace(
      '  defaultLanguage,\n',
      '  defaultLanguage,\n  fallbackLanguage,\n',
    )
  }
  if (!updated.includes('fallbackLng: defaultLanguage,')) {
    if (updated.includes('fallbackLng: fallbackLanguage,')) return updated
    throw new ProjectError('src/i18n/config.ts no contiene el fallback gestionado.')
  }
  return updated.replace('fallbackLng: defaultLanguage,', 'fallbackLng: fallbackLanguage,')
}

const loadRequiredContent = async (target: string, path: string): Promise<string> => {
  const file = await readProjectFile(target, path)
  if (!file) throw new ProjectError(`Falta el archivo gestionado ${path}.`)
  return file.content
}

const renderDesiredFiles = async (
  target: string,
  config: ProjectConfig,
  manifest: BaselineManifest,
): Promise<Map<string, string | null>> => {
  const packageJson = await loadRequiredContent(target, 'package.json')
  const packageLock = await loadRequiredContent(target, 'package-lock.json')
  const indexHtml = await loadRequiredContent(target, 'index.html')
  const viteConfig = await loadRequiredContent(target, 'vite.config.ts')
  const i18nConfig = await loadRequiredContent(target, 'src/i18n/config.ts')
  const loadingText = config.localization.resources[config.localization.defaultLanguage].common.routes.loading
  const desired = new Map<string, string | null>([
    ['package.json', updatePackageJson(packageJson, config)],
    ['package-lock.json', updatePackageLock(packageLock, config)],
    ['index.html', updateIndexHtml(indexHtml, config)],
    ['vite.config.ts', updateViteConfig(viteConfig, config)],
    ['src/i18n/config.ts', updateI18nConfig(i18nConfig)],
    ['src/i18n/resources.ts', renderResources(config)],
    ['tests/app/RouteLoading/index.test.tsx', renderRouteLoadingTest(loadingText)],
    ['tests/app/App/index.test.tsx', renderAppTest(loadingText)],
    ['README.md', renderReadme(config)],
    ['specs/README.md', renderSpecsIndex()],
    ['specs/product-vision.md', renderProductVision(config)],
    ['.env.example', config.environments.publicVariables.map((name) => `${name}=`).join('\n') + (config.environments.publicVariables.length > 0 ? '\n' : '')],
  ])

  for (const locale of Object.keys(config.localization.resources).sort()) {
    desired.set(
      `src/locales/${locale}/common.json`,
      prettyJson(config.localization.resources[locale].common),
    )
  }
  for (const path of Object.keys(manifest.managedFiles)) {
    if (path.startsWith('src/locales/') && !desired.has(path)) desired.set(path, null)
  }
  return desired
}

const listLocaleFiles = async (target: string): Promise<string[]> => {
  const root = resolve(target, 'src/locales')
  try {
    const locales = await readdir(root, { withFileTypes: true })
    const paths: string[] = []
    for (const locale of locales) {
      if (!locale.isDirectory()) continue
      const files = await readdir(resolve(root, locale.name), { withFileTypes: true })
      for (const file of files) {
        if (file.isFile()) paths.push(relative(target, resolve(root, locale.name, file.name)))
      }
    }
    return paths.sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
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
    schemaVersion: 1,
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

  const desired = await renderDesiredFiles(target, config, manifest)
  const knownPaths = new Set([...Object.keys(manifest.managedFiles), ...desired.keys()])
  for (const localePath of await listLocaleFiles(target)) {
    if (!knownPaths.has(localePath)) {
      throw new ProjectError(`Existe un recurso de locale no gestionado que no se sobrescribirá: ${localePath}`)
    }
  }

  desired.set('.template-state.json', stateContent(config, manifest, desired))
  const operations: FileOperation[] = []
  for (const [path, content] of [...desired.entries()].sort(([left], [right]) => left.localeCompare(right))) {
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
    schemaVersion: 1,
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
    warnings: collectPending(config).map((path) => `Decisión pendiente: ${path}`),
  }
}

export const isPendingValue = (value: unknown): value is PendingValue =>
  typeof value === 'object' && value !== null && 'status' in value && value.status === 'pending'
