export type QualityDiagnostic = {
  code: string
  path: string
  message: string
  line?: number
  column?: number
}

export type QualityIo = {
  stdout: (value: string) => void
  stderr: (value: string) => void
}

export type QualityRun = {
  label: string
  diagnostics: QualityDiagnostic[]
  checkedFiles: number
}
