export type ProjectConfig = {
  schemaVersion: 2
  identity: {
    displayName: string
    packageName: string
  }
}

export type EffectiveProjectConfig = ProjectConfig & {
  identity: ProjectConfig['identity'] & {
    packageVersion: '0.1.0'
    htmlTitle: string
  }
}

export type BaselineManifest = {
  schemaVersion: 2
  baselineId: string
  canonicalRemote: string
  derivation: {
    exclude: string[]
  }
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
