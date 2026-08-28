import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type {
  PendingValue,
  ProjectConfig,
  ResolvedOrPending,
  SuitabilityCriterion,
} from './types.ts'

const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const PUBLIC_VARIABLE = /^VITE_[A-Z][A-Z0-9_]*$/
const LOCALE_PATH = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/
const SECRET_KEY = /(?:password|passwd|secret|token|credential|private.?key|api.?key)/i
const ALLOWED_SECRET_POLICY_KEY = 'secretsPolicy'

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

const readString = (
  value: unknown,
  path: string,
  issues: string[],
): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push(`${path} debe ser una cadena no vacía.`)
    return ''
  }
  if (value !== value.trim()) issues.push(`${path} no puede empezar ni terminar con espacios.`)
  return value
}

const readStringArray = (
  value: unknown,
  path: string,
  issues: string[],
  allowEmpty = false,
): string[] => {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    issues.push(`${path} debe ser una lista${allowEmpty ? '' : ' no vacía'}.`)
    return []
  }
  return value.map((item, index) => readString(item, `${path}[${index}]`, issues))
}

const readPending = (
  value: JsonObject,
  path: string,
  issues: string[],
): PendingValue => {
  assertExactKeys(
    value,
    ['status', 'responsible', 'resolutionCondition'],
    path,
    issues,
  )
  if (value.status !== 'pending') issues.push(`${path}.status debe ser "pending".`)
  return {
    status: 'pending',
    responsible: readString(value.responsible, `${path}.responsible`, issues),
    resolutionCondition: readString(
      value.resolutionCondition,
      `${path}.resolutionCondition`,
      issues,
    ),
  }
}

const readResolvedOrPending = (
  value: unknown,
  path: string,
  issues: string[],
): ResolvedOrPending => {
  if (typeof value === 'string') return readString(value, path, issues)
  return readPending(assertObject(value, path, issues), path, issues)
}

const readSuitabilityCriterion = (
  value: unknown,
  path: string,
  issues: string[],
): SuitabilityCriterion => {
  const object = assertObject(value, path, issues)
  const decision = object.decision
  if (!['compatible', 'incompatible', 'pending'].includes(String(decision))) {
    issues.push(`${path}.decision debe ser compatible, incompatible o pending.`)
  }
  const allowed = decision === 'pending'
    ? ['decision', 'rationale', 'responsible', 'resolutionCondition']
    : ['decision', 'rationale']
  assertExactKeys(object, allowed, path, issues)
  const result: SuitabilityCriterion = {
    decision: ['compatible', 'incompatible', 'pending'].includes(String(decision))
      ? decision as SuitabilityCriterion['decision']
      : 'pending',
    rationale: readString(object.rationale, `${path}.rationale`, issues),
  }
  if (decision === 'pending') {
    result.responsible = readString(object.responsible, `${path}.responsible`, issues)
    result.resolutionCondition = readString(
      object.resolutionCondition,
      `${path}.resolutionCondition`,
      issues,
    )
  }
  return result
}

const validateLocale = (value: string, path: string, issues: string[]) => {
  if (!LOCALE_PATH.test(value)) {
    issues.push(`${path} solo puede contener segmentos alfanuméricos separados por guiones.`)
    return
  }
  try {
    new Intl.Locale(value)
  } catch {
    issues.push(`${path} debe ser una etiqueta BCP 47 válida.`)
  }
}

const findSecretKeys = (value: unknown, path: string, issues: string[]) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findSecretKeys(item, `${path}[${index}]`, issues))
    return
  }
  if (!isObject(value)) return
  for (const [key, child] of Object.entries(value)) {
    if (key !== ALLOWED_SECRET_POLICY_KEY && SECRET_KEY.test(key)) {
      issues.push(`${path}.${key} parece un campo de secreto y no está permitido.`)
    }
    findSecretKeys(child, `${path}.${key}`, issues)
  }
}

export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export const hashText = (value: string): string =>
  createHash('sha256').update(value).digest('hex')

export const configDigest = (config: ProjectConfig): string =>
  hashText(canonicalJson(config))

export const validateProjectConfig = (value: unknown): ProjectConfig => {
  const issues: string[] = []
  const root = assertObject(value, '$', issues)
  const rootKeys = [
    '$schema',
    'schemaVersion',
    'derivation',
    'identity',
    'localization',
    'productVision',
    'support',
    'deployment',
    'environments',
    'repository',
    'quality',
  ] as const
  assertExactKeys(root, rootKeys, '$', issues, rootKeys.filter((key) => key !== '$schema'))
  findSecretKeys(root, '$', issues)

  if (root.schemaVersion !== 1) issues.push('$.schemaVersion debe ser 1.')

  const derivation = assertObject(root.derivation, '$.derivation', issues)
  assertExactKeys(derivation, ['status', 'evidence', 'suitability'], '$.derivation', issues)
  if (derivation.status !== 'confirmed-derived') {
    issues.push('$.derivation.status debe ser "confirmed-derived".')
  }
  const suitability = assertObject(
    derivation.suitability,
    '$.derivation.suitability',
    issues,
  )
  assertExactKeys(suitability, ['status', 'criteria'], '$.derivation.suitability', issues)
  if (!['suitable', 'not-suitable'].includes(String(suitability.status))) {
    issues.push('$.derivation.suitability.status debe ser suitable o not-suitable.')
  }
  const criteria = assertObject(
    suitability.criteria,
    '$.derivation.suitability.criteria',
    issues,
  )
  const criterionNames = [
    'seoAndPreRenderedHtml',
    'serverRendering',
    'serverCapabilities',
    'initialPerformance',
    'hostingAndPlatforms',
  ] as const
  assertExactKeys(criteria, criterionNames, '$.derivation.suitability.criteria', issues)
  const parsedCriteria = Object.fromEntries(criterionNames.map((name) => [
    name,
    readSuitabilityCriterion(
      criteria[name],
      `$.derivation.suitability.criteria.${name}`,
      issues,
    ),
  ])) as ProjectConfig['derivation']['suitability']['criteria']

  const identity = assertObject(root.identity, '$.identity', issues)
  assertExactKeys(
    identity,
    ['displayName', 'packageName', 'packageVersion', 'htmlTitle'],
    '$.identity',
    issues,
  )
  const packageName = readString(identity.packageName, '$.identity.packageName', issues)
  if (packageName.length > 214 || !PACKAGE_NAME.test(packageName)) {
    issues.push('$.identity.packageName debe ser un nombre npm válido en minúsculas.')
  }
  const packageVersion = readString(
    identity.packageVersion,
    '$.identity.packageVersion',
    issues,
  )
  if (!SEMVER.test(packageVersion)) {
    issues.push('$.identity.packageVersion debe ser una versión semántica válida.')
  }

  const localization = assertObject(root.localization, '$.localization', issues)
  assertExactKeys(
    localization,
    ['defaultLanguage', 'fallbackLanguage', 'htmlLanguage', 'resources'],
    '$.localization',
    issues,
  )
  const defaultLanguage = readString(
    localization.defaultLanguage,
    '$.localization.defaultLanguage',
    issues,
  )
  const fallbackLanguage = readString(
    localization.fallbackLanguage,
    '$.localization.fallbackLanguage',
    issues,
  )
  const htmlLanguage = readString(
    localization.htmlLanguage,
    '$.localization.htmlLanguage',
    issues,
  )
  validateLocale(defaultLanguage, '$.localization.defaultLanguage', issues)
  validateLocale(fallbackLanguage, '$.localization.fallbackLanguage', issues)
  validateLocale(htmlLanguage, '$.localization.htmlLanguage', issues)
  const resourcesObject = assertObject(
    localization.resources,
    '$.localization.resources',
    issues,
  )
  if (Object.keys(resourcesObject).length === 0) {
    issues.push('$.localization.resources debe contener al menos un locale.')
  }
  const parsedResources: ProjectConfig['localization']['resources'] = {}
  for (const [locale, resourceValue] of Object.entries(resourcesObject)) {
    validateLocale(locale, `$.localization.resources.${locale}`, issues)
    const resource = assertObject(
      resourceValue,
      `$.localization.resources.${locale}`,
      issues,
    )
    assertExactKeys(resource, ['common'], `$.localization.resources.${locale}`, issues)
    const common = assertObject(
      resource.common,
      `$.localization.resources.${locale}.common`,
      issues,
    )
    assertExactKeys(common, ['routes'], `$.localization.resources.${locale}.common`, issues)
    const routes = assertObject(
      common.routes,
      `$.localization.resources.${locale}.common.routes`,
      issues,
    )
    assertExactKeys(
      routes,
      ['loading'],
      `$.localization.resources.${locale}.common.routes`,
      issues,
    )
    parsedResources[locale] = {
      common: {
        routes: {
          loading: readString(
            routes.loading,
            `$.localization.resources.${locale}.common.routes.loading`,
            issues,
          ),
        },
      },
    }
  }
  if (!(defaultLanguage in parsedResources)) {
    issues.push('$.localization.defaultLanguage debe existir en resources.')
  }
  if (!(fallbackLanguage in parsedResources)) {
    issues.push('$.localization.fallbackLanguage debe existir en resources.')
  }

  const vision = assertObject(root.productVision, '$.productVision', issues)
  const visionKeys = [
    'documentDate',
    'problemAndContext',
    'users',
    'outcomes',
    'included',
    'excluded',
    'metrics',
    'constraints',
    'assumptions',
    'accessibility',
    'responsive',
    'securityAndPrivacy',
    'performance',
    'observability',
    'risks',
    'openQuestions',
  ] as const
  assertExactKeys(vision, visionKeys, '$.productVision', issues)
  const metrics = Array.isArray(vision.metrics) ? vision.metrics : []
  if (!Array.isArray(vision.metrics) || metrics.length === 0) {
    issues.push('$.productVision.metrics debe ser una lista no vacía.')
  }
  const parsedMetrics = metrics.map((value, index) => {
    const path = `$.productVision.metrics[${index}]`
    const metric = assertObject(value, path, issues)
    assertExactKeys(metric, ['metric', 'baseline', 'target', 'measurement'], path, issues)
    return {
      metric: readString(metric.metric, `${path}.metric`, issues),
      baseline: readResolvedOrPending(metric.baseline, `${path}.baseline`, issues),
      target: readResolvedOrPending(metric.target, `${path}.target`, issues),
      measurement: readString(metric.measurement, `${path}.measurement`, issues),
    }
  })
  const openQuestions = Array.isArray(vision.openQuestions) ? vision.openQuestions : []
  if (!Array.isArray(vision.openQuestions)) {
    issues.push('$.productVision.openQuestions debe ser una lista.')
  }
  const parsedQuestions = openQuestions.map((value, index) => {
    const path = `$.productVision.openQuestions[${index}]`
    const question = assertObject(value, path, issues)
    assertExactKeys(
      question,
      ['question', 'responsible', 'resolutionCondition'],
      path,
      issues,
    )
    return {
      question: readString(question.question, `${path}.question`, issues),
      responsible: readString(question.responsible, `${path}.responsible`, issues),
      resolutionCondition: readString(
        question.resolutionCondition,
        `${path}.resolutionCondition`,
        issues,
      ),
    }
  })

  const support = assertObject(root.support, '$.support', issues)
  assertExactKeys(support, ['browsersAndDevices'], '$.support', issues)

  const deployment = assertObject(root.deployment, '$.deployment', issues)
  assertExactKeys(deployment, ['hosting', 'basePath', 'spaFallback'], '$.deployment', issues)
  const basePath = readString(deployment.basePath, '$.deployment.basePath', issues)
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
    issues.push('$.deployment.basePath debe comenzar y terminar con "/".')
  }
  if (basePath.includes('..') || basePath.includes('?') || basePath.includes('#')) {
    issues.push('$.deployment.basePath no puede contener "..", query ni fragmento.')
  }

  const environments = assertObject(root.environments, '$.environments', issues)
  assertExactKeys(
    environments,
    ['names', 'publicVariables', 'secretsPolicy'],
    '$.environments',
    issues,
  )
  const publicVariables = readStringArray(
    environments.publicVariables,
    '$.environments.publicVariables',
    issues,
    true,
  )
  for (const [index, variable] of publicVariables.entries()) {
    if (!PUBLIC_VARIABLE.test(variable) || SECRET_KEY.test(variable)) {
      issues.push(
        `$.environments.publicVariables[${index}] debe ser un nombre VITE_ público y no sensible.`,
      )
    }
  }
  if (new Set(publicVariables).size !== publicVariables.length) {
    issues.push('$.environments.publicVariables no puede contener duplicados.')
  }

  const repository = assertObject(root.repository, '$.repository', issues)
  assertExactKeys(
    repository,
    ['url', 'visibility', 'license', 'historyStrategy'],
    '$.repository',
    issues,
  )

  const quality = assertObject(root.quality, '$.quality', issues)
  assertExactKeys(quality, ['commands'], '$.quality', issues)

  const result: ProjectConfig = {
    schemaVersion: 1,
    derivation: {
      status: 'confirmed-derived',
      evidence: readString(derivation.evidence, '$.derivation.evidence', issues),
      suitability: {
        status: suitability.status === 'not-suitable' ? 'not-suitable' : 'suitable',
        criteria: parsedCriteria,
      },
    },
    identity: {
      displayName: readString(identity.displayName, '$.identity.displayName', issues),
      packageName,
      packageVersion,
      htmlTitle: readString(identity.htmlTitle, '$.identity.htmlTitle', issues),
    },
    localization: {
      defaultLanguage,
      fallbackLanguage,
      htmlLanguage,
      resources: parsedResources,
    },
    productVision: {
      documentDate: readString(
        vision.documentDate,
        '$.productVision.documentDate',
        issues,
      ),
      problemAndContext: readString(
        vision.problemAndContext,
        '$.productVision.problemAndContext',
        issues,
      ),
      users: readStringArray(vision.users, '$.productVision.users', issues),
      outcomes: readStringArray(vision.outcomes, '$.productVision.outcomes', issues),
      included: readStringArray(vision.included, '$.productVision.included', issues),
      excluded: readStringArray(vision.excluded, '$.productVision.excluded', issues, true),
      metrics: parsedMetrics,
      constraints: readStringArray(
        vision.constraints,
        '$.productVision.constraints',
        issues,
        true,
      ),
      assumptions: readStringArray(
        vision.assumptions,
        '$.productVision.assumptions',
        issues,
        true,
      ),
      accessibility: readResolvedOrPending(
        vision.accessibility,
        '$.productVision.accessibility',
        issues,
      ),
      responsive: readResolvedOrPending(
        vision.responsive,
        '$.productVision.responsive',
        issues,
      ),
      securityAndPrivacy: readResolvedOrPending(
        vision.securityAndPrivacy,
        '$.productVision.securityAndPrivacy',
        issues,
      ),
      performance: readResolvedOrPending(
        vision.performance,
        '$.productVision.performance',
        issues,
      ),
      observability: readResolvedOrPending(
        vision.observability,
        '$.productVision.observability',
        issues,
      ),
      risks: readStringArray(vision.risks, '$.productVision.risks', issues, true),
      openQuestions: parsedQuestions,
    },
    support: {
      browsersAndDevices: readResolvedOrPending(
        support.browsersAndDevices,
        '$.support.browsersAndDevices',
        issues,
      ),
    },
    deployment: {
      hosting: readResolvedOrPending(deployment.hosting, '$.deployment.hosting', issues),
      basePath,
      spaFallback: readResolvedOrPending(
        deployment.spaFallback,
        '$.deployment.spaFallback',
        issues,
      ),
    },
    environments: {
      names: readStringArray(environments.names, '$.environments.names', issues),
      publicVariables,
      secretsPolicy: readString(
        environments.secretsPolicy,
        '$.environments.secretsPolicy',
        issues,
      ),
    },
    repository: {
      url: readResolvedOrPending(repository.url, '$.repository.url', issues),
      visibility: readResolvedOrPending(
        repository.visibility,
        '$.repository.visibility',
        issues,
      ),
      license: readResolvedOrPending(repository.license, '$.repository.license', issues),
      historyStrategy: readResolvedOrPending(
        repository.historyStrategy,
        '$.repository.historyStrategy',
        issues,
      ),
    },
    quality: {
      commands: readStringArray(quality.commands, '$.quality.commands', issues),
    },
  }

  const documentDate = result.productVision.documentDate
  const parsedDate = new Date(`${documentDate}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(documentDate)
    || Number.isNaN(parsedDate.valueOf())
    || parsedDate.toISOString().slice(0, 10) !== documentDate
  ) {
    issues.push('$.productVision.documentDate debe usar el formato AAAA-MM-DD.')
  }

  for (const [name, criterion] of Object.entries(parsedCriteria)) {
    if (criterion.decision === 'incompatible') {
      issues.push(`$.derivation.suitability.criteria.${name} es incompatible con la baseline.`)
    }
    if (criterion.decision === 'pending') {
      issues.push(`$.derivation.suitability.criteria.${name} sigue pendiente y bloquea la inicialización.`)
    }
  }
  if (result.derivation.suitability.status !== 'suitable') {
    issues.push('$.derivation.suitability.status debe confirmar que la SPA es idónea.')
  }

  if (issues.length > 0) throw new ConfigError([...new Set(issues)])
  return result
}

export const loadProjectConfig = async (path: string): Promise<ProjectConfig> => {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (error) {
    throw new ConfigError([
      `No se puede leer ${path}: ${error instanceof Error ? error.message : String(error)}`,
    ])
  }
  try {
    return validateProjectConfig(JSON.parse(raw))
  } catch (error) {
    if (error instanceof ConfigError) throw error
    throw new ConfigError([`JSON inválido en ${path}.`])
  }
}
