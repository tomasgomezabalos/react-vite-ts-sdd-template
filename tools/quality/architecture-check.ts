import { resolve } from 'node:path'
import { analyzeImports, resolveImport } from './imports.ts'
import { classifyModule, evaluateDependency } from './architecture-policy.ts'
import { repositoryPath } from './filesystem.ts'
import { isExecutedModule, runQualityMain } from './output.ts'
import type { QualityDiagnostic, QualityIo, QualityRun } from './types.ts'

export const checkArchitecture = async (root: string): Promise<QualityRun> => {
  const absoluteRoot = resolve(root)
  const analysis = await analyzeImports(absoluteRoot)
  const diagnostics: QualityDiagnostic[] = []
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
