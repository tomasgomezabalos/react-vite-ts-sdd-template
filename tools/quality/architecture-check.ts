import { resolve } from 'node:path'
import { analyzeImports, resolveImport } from './imports.ts'
import {
  classifyModule,
  evaluateDependency,
  forbiddenFolderViolation,
  restrictedImportViolation,
} from './architecture-policy.ts'
import { collectFiles, repositoryPath } from './filesystem.ts'
import { isExecutedModule, runQualityMain } from './output.ts'
import type { QualityDiagnostic, QualityIo, QualityRun } from './types.ts'

const resolvedRepositoryPath = (
  root: string,
  absolute: string | undefined,
): string | undefined =>
  absolute === undefined ? undefined : repositoryPath(root, absolute)

export const checkArchitecture = async (root: string): Promise<QualityRun> => {
  const absoluteRoot = resolve(root)
  const analysis = await analyzeImports(absoluteRoot)
  const diagnostics: QualityDiagnostic[] = []
  const reportedFolders = new Set<string>()
  const sourceFiles = await collectFiles(
    resolve(absoluteRoot, 'src'),
    () => true,
  )
  for (const file of sourceFiles) {
    const path = repositoryPath(absoluteRoot, file)
    const violation = forbiddenFolderViolation(path)
    const folder = path.split('/')[1] ?? ''
    if (!violation || reportedFolders.has(folder)) continue
    reportedFolders.add(folder)
    diagnostics.push({ code: violation.code, path, message: violation.message })
  }
  for (const source of analysis.sources) {
    const sourcePath = repositoryPath(absoluteRoot, source.source)
    const sourceOwner = classifyModule(sourcePath)
    for (const reference of source.references) {
      if (!reference.specifier) {
        diagnostics.push({
          code: 'ARCH_DYNAMIC_UNCHECKABLE',
          path: sourcePath,
          line: reference.line,
          column: reference.column,
          message:
            'El destino de import() debe ser un literal estático para comprobar su arquitectura.',
        })
        continue
      }
      const resolvedImport = resolveImport(
        absoluteRoot,
        source.source,
        reference.specifier,
        analysis.compilerOptions,
        analysis.configuredAliases,
      )
      const restricted = restrictedImportViolation(
        sourcePath,
        reference.specifier,
        resolvedRepositoryPath(
          absoluteRoot,
          resolvedImport.path ?? resolvedImport.externalPath,
        ),
      )
      if (restricted) {
        diagnostics.push({
          code: restricted.code,
          path: sourcePath,
          line: reference.line,
          column: reference.column,
          message: `${restricted.message} Import: ${reference.specifier}.`,
        })
      }
      if (!resolvedImport.internal) continue
      if (resolvedImport.unresolvedInternal || !resolvedImport.path) {
        diagnostics.push({
          code: 'ARCH_INTERNAL_UNRESOLVED',
          path: sourcePath,
          line: reference.line,
          column: reference.column,
          message: `No se puede resolver el import interno ${reference.specifier}.`,
        })
        continue
      }
      const targetPath = repositoryPath(absoluteRoot, resolvedImport.path)
      const violation = evaluateDependency(
        sourceOwner,
        classifyModule(targetPath),
      )
      if (violation) {
        diagnostics.push({
          code: violation.code,
          path: sourcePath,
          line: reference.line,
          column: reference.column,
          message: `${violation.message} Destino: ${targetPath}.`,
        })
      }
    }
  }
  return {
    label: 'architecture:check',
    diagnostics,
    checkedFiles: analysis.sources.length,
  }
}

export const main = async (
  root = process.cwd(),
  io?: QualityIo,
): Promise<number> => runQualityMain(() => checkArchitecture(root), io)

if (isExecutedModule(import.meta.url)) {
  process.exitCode = await main()
}
