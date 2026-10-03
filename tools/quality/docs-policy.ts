import { basename } from 'node:path'

export const requiredDocumentationFiles = [
  'AGENTS.md',
  'README.md',
  'docs/architecture/README.md',
  'docs/platform/README.md',
  'docs/sdd/README.md',
  'docs/sdd/change-policy.md',
  'docs/sdd/constitution.md',
  'docs/sdd/templates/adr.md',
  'docs/sdd/templates/feature-spec.md',
  'docs/sdd/templates/product-vision.md',
  'docs/sdd/templates/quick-change.md',
  'docs/sdd/templates/technical-plan.md',
  'docs/sdd/templates/validation-report.md',
  'docs/sdd/workflow.md',
  'specs/README.md',
] as const

export const staticIndexEntries: Record<string, string[]> = {
  'docs/sdd/README.md': [
    'docs/sdd/change-policy.md',
    'docs/sdd/constitution.md',
    'docs/sdd/templates/adr.md',
    'docs/sdd/templates/feature-spec.md',
    'docs/sdd/templates/product-vision.md',
    'docs/sdd/templates/quick-change.md',
    'docs/sdd/templates/technical-plan.md',
    'docs/sdd/templates/validation-report.md',
    'docs/sdd/workflow.md',
  ],
  'docs/platform/README.md': [
    'docs/platform/specs/001-enrutamiento-base-spa/spec.md',
    'docs/platform/specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md',
    'docs/platform/specs/002-carga-diferida-rutas/spec.md',
  ],
}

const currentArchitectureDecision = (path: string): boolean => {
  const match = path.match(/^docs\/architecture\/decisions\/(\d{4})-/)
  return Boolean(match && Number(match[1]) >= 9)
}

const currentPlatformArtifact = (path: string): boolean => {
  const match = path.match(
    /^docs\/platform\/specs\/(\d{3})-[^/]+\/(spec|plan|validation-report|quick-change)\.md$/,
  )
  return Boolean(match && Number(match[1]) >= 3)
}

const productArtifact = (path: string): boolean =>
  path.startsWith('specs/') &&
  path !== 'specs/README.md' &&
  path.endsWith('.md')

export const requiredQuickChangeSections = [
  'Contrato afectado',
  'Delta funcional',
  'Criterios afectados',
  'Alcance técnico mínimo',
  'Pruebas y validación previstas',
  'Riesgos y reclasificación',
  'Puerta documental',
] as const

export const isQuickChange = (path: string): boolean =>
  basename(path) === 'quick-change.md'

export const isValidationReport = (path: string): boolean =>
  basename(path) === 'validation-report.md'

export const isGovernedArtifact = (path: string): boolean =>
  [
    'docs/sdd/change-policy.md',
    'docs/sdd/constitution.md',
    'docs/sdd/workflow.md',
  ].includes(path) ||
  currentArchitectureDecision(path) ||
  currentPlatformArtifact(path) ||
  productArtifact(path)

export const expectedDynamicIndexEntries = (
  markdownPaths: string[],
): Record<string, string[]> => {
  const architecture = markdownPaths.filter((path) =>
    /^docs\/architecture\/decisions\/\d{4}-.+\.md$/.test(path),
  )
  const currentPlatform = markdownPaths.filter(currentPlatformArtifact)
  const product = markdownPaths.filter(productArtifact)
  return {
    'docs/architecture/README.md': architecture,
    'docs/platform/README.md': currentPlatform,
    'specs/README.md': product,
  }
}

export const documentStates = new Set(['DRAFT', 'APPROVED', 'SUPERSEDED'])
export const deliveryStates = new Set([
  'NOT_STARTED',
  'IMPLEMENTED',
  'VALIDATED',
  'BLOCKED',
  'NOT_APPLICABLE',
])
