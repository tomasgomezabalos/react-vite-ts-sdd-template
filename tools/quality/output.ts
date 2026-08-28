import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import type {
  QualityDiagnostic,
  QualityIo,
  QualityRun,
} from './types.ts'

export const defaultQualityIo: QualityIo = {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
}

export const sortDiagnostics = (
  diagnostics: QualityDiagnostic[],
): QualityDiagnostic[] => [...diagnostics].sort((left, right) =>
  left.path.localeCompare(right.path)
  || (left.line ?? 0) - (right.line ?? 0)
  || (left.column ?? 0) - (right.column ?? 0)
  || left.code.localeCompare(right.code)
  || left.message.localeCompare(right.message))

const formatLocation = (diagnostic: QualityDiagnostic): string => {
  if (diagnostic.line === undefined) return diagnostic.path
  if (diagnostic.column === undefined) return `${diagnostic.path}:${diagnostic.line}`
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column}`
}

export const formatDiagnostic = (diagnostic: QualityDiagnostic): string =>
  `${formatLocation(diagnostic)} [${diagnostic.code}] ${diagnostic.message}`

export const reportQualityRun = (
  run: QualityRun,
  io: QualityIo = defaultQualityIo,
): number => {
  const diagnostics = sortDiagnostics(run.diagnostics)
  if (diagnostics.length === 0) {
    io.stdout(`${run.label}: OK (${run.checkedFiles} archivos comprobados).\n`)
    return 0
  }
  io.stderr(`${run.label}: ${diagnostics.length} incumplimiento(s).\n`)
  for (const diagnostic of diagnostics) {
    io.stderr(`${formatDiagnostic(diagnostic)}\n`)
  }
  return 1
}

export const runQualityMain = async (
  operation: () => Promise<QualityRun>,
  io: QualityIo = defaultQualityIo,
): Promise<number> => {
  try {
    return reportQualityRun(await operation(), io)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    io.stderr(`QUALITY_INTERNAL_ERROR: ${message}\n`)
    return 2
  }
}

export const isExecutedModule = (moduleUrl: string): boolean => {
  const entrypoint = process.argv[1]
  return Boolean(entrypoint) && resolve(fileURLToPath(moduleUrl)) === resolve(entrypoint)
}
