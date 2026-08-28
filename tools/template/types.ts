export type PendingValue = {
  status: 'pending'
  responsible: string
  resolutionCondition: string
}

export type ResolvedOrPending = string | PendingValue

export type SuitabilityCriterion = {
  decision: 'compatible' | 'incompatible' | 'pending'
  rationale: string
  responsible?: string
  resolutionCondition?: string
}

export type ProjectConfig = {
  schemaVersion: 1
  derivation: {
    status: 'confirmed-derived'
    evidence: string
    suitability: {
      status: 'suitable' | 'not-suitable'
      criteria: {
        seoAndPreRenderedHtml: SuitabilityCriterion
        serverRendering: SuitabilityCriterion
        serverCapabilities: SuitabilityCriterion
        initialPerformance: SuitabilityCriterion
        hostingAndPlatforms: SuitabilityCriterion
      }
    }
  }
  identity: {
    displayName: string
    packageName: string
    packageVersion: string
    htmlTitle: string
  }
  localization: {
    defaultLanguage: string
    fallbackLanguage: string
    htmlLanguage: string
    resources: Record<string, { common: { routes: { loading: string } } }>
  }
  productVision: {
    documentDate: string
    problemAndContext: string
    users: string[]
    outcomes: string[]
    included: string[]
    excluded: string[]
    metrics: Array<{
      metric: string
      baseline: ResolvedOrPending
      target: ResolvedOrPending
      measurement: string
    }>
    constraints: string[]
    assumptions: string[]
    accessibility: ResolvedOrPending
    responsive: ResolvedOrPending
    securityAndPrivacy: ResolvedOrPending
    performance: ResolvedOrPending
    observability: ResolvedOrPending
    risks: string[]
    openQuestions: Array<{
      question: string
      responsible: string
      resolutionCondition: string
    }>
  }
  support: {
    browsersAndDevices: ResolvedOrPending
  }
  deployment: {
    hosting: ResolvedOrPending
    basePath: string
    spaFallback: ResolvedOrPending
  }
  environments: {
    names: string[]
    publicVariables: string[]
    secretsPolicy: string
  }
  repository: {
    url: ResolvedOrPending
    visibility: ResolvedOrPending
    license: ResolvedOrPending
    historyStrategy: ResolvedOrPending
  }
  quality: {
    commands: string[]
  }
}

export type BaselineManifest = {
  schemaVersion: 1
  baselineId: string
  canonicalRemote: string
  managedFiles: Record<string, string>
}

export type FileOperationKind = 'create' | 'modify' | 'delete' | 'unchanged'

export type FileOperation = {
  kind: FileOperationKind
  path: string
  beforeHash: string | null
  afterHash: string | null
  content?: string
  mode: number
}

export type InitializationState = {
  schemaVersion: 1
  baselineId: string
  configDigest: string
  managedFiles: Record<string, string | null>
}

export type Preview = {
  target: string
  configDigest: string
  token: string
  operations: FileOperation[]
  warnings: string[]
}

export type TransactionJournal = {
  schemaVersion: 1
  id: string
  target: string
  status: 'prepared' | 'applying' | 'rolling-back'
  operations: Array<{
    path: string
    kind: Exclude<FileOperationKind, 'unchanged'>
    beforeHash: string | null
    afterHash: string | null
    mode: number
    backupPath: string | null
    applied: boolean
  }>
}

export type DiagnosticStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN'

export type Diagnostic = {
  code: string
  status: DiagnosticStatus
  message: string
  path?: string
  limitation?: string
}

export type OutputFormat = 'human' | 'json'
