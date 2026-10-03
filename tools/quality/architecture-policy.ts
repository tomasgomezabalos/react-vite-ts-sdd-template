import { basename, extname } from 'node:path'
import { toPortablePath } from './filesystem.ts'

export type ArchitectureLayer =
  'root' | 'app' | 'pages' | 'features' | 'entities' | 'shared'

export type ModuleOwner = {
  layer: ArchitectureLayer
  owner?: string
  path: string
}

export type ArchitectureViolation = {
  code: string
  message: string
}

const layerOrder: Record<ArchitectureLayer, number> = {
  root: -1,
  app: 0,
  pages: 1,
  features: 2,
  entities: 3,
  shared: 4,
}

export const classifyModule = (rootRelativePath: string): ModuleOwner => {
  const path = toPortablePath(rootRelativePath)
  if (path === 'src/main.tsx' || path === 'src/main.ts')
    return { layer: 'root', path }
  if (path === 'src/index.scss' || path === 'src/index.css')
    return { layer: 'shared', path }
  if (path.startsWith('src/i18n/') || path.startsWith('src/locales/'))
    return { layer: 'shared', path }
  const match = path.match(
    /^src\/(app|pages|features|entities|shared)(?:\/([^/]+))?/,
  )
  if (!match) return { layer: 'shared', path }
  const layer = match[1] as Exclude<ArchitectureLayer, 'root'>
  const owner = ['pages', 'features', 'entities'].includes(layer)
    ? match[2]
    : undefined
  return { layer, ...(owner ? { owner } : {}), path }
}

const isPublicPageEntrypoint = (target: ModuleOwner): boolean => {
  if (target.layer !== 'pages' || !target.owner) return false
  const withoutExtension = target.path.slice(0, -extname(target.path).length)
  return withoutExtension === `src/pages/${target.owner}/index`
}

export const evaluateDependency = (
  source: ModuleOwner,
  target: ModuleOwner,
): ArchitectureViolation | null => {
  if (source.layer === 'root') {
    if (target.layer === 'pages' && !isPublicPageEntrypoint(target)) {
      return {
        code: 'ARCH_PRIVATE_PAGE_IMPORT',
        message: `La raíz solo puede importar la entrada pública de la página ${target.owner ?? basename(target.path)}.`,
      }
    }
    return null
  }

  if (layerOrder[target.layer] < layerOrder[source.layer]) {
    return {
      code: 'ARCH_LAYER_DIRECTION',
      message: `${source.layer} no puede importar la capa superior ${target.layer}.`,
    }
  }

  if (
    source.layer === 'pages' &&
    target.layer === 'pages' &&
    source.owner !== target.owner
  ) {
    return {
      code: 'ARCH_PAGE_TO_PAGE',
      message: `La página ${source.owner ?? source.path} no puede importar la página ${target.owner ?? target.path}.`,
    }
  }

  if (
    target.layer === 'pages' &&
    source.owner !== target.owner &&
    !isPublicPageEntrypoint(target)
  ) {
    return {
      code: 'ARCH_PRIVATE_PAGE_IMPORT',
      message: `El módulo interno de la página ${target.owner ?? target.path} es privado.`,
    }
  }

  return null
}
