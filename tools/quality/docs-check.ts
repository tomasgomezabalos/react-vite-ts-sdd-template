import { readFile } from 'node:fs/promises'
import {
  dirname,
  extname,
  resolve,
} from 'node:path'
import {
  collectFiles,
  inspectPath,
  isRegularFile,
  isWithinRoot,
  repositoryPath,
} from './filesystem.ts'
import {
  deliveryStates,
  documentStates,
  expectedDynamicIndexEntries,
  isGovernedArtifact,
  isValidationReport,
  requiredDocumentationFiles,
  staticIndexEntries,
} from './docs-policy.ts'
import { parseMarkdown } from './markdown.ts'
import {
  isExecutedModule,
  runQualityMain,
} from './output.ts'
import type {
  QualityDiagnostic,
  QualityIo,
  QualityRun,
} from './types.ts'

const externalDestination = (destination: string): boolean =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(destination)

const metadata = (content: string, name: string): string | undefined => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.+?)\\s*$`, 'm'))?.[1]
}

const pendingMetadata = (value: string | undefined): boolean =>
  !value || value === 'Pendiente' || /^<.+>$/.test(value)

const diagnostic = (
  code: string,
  path: string,
  message: string,
  line?: number,
  column?: number,
): QualityDiagnostic => ({
  code,
  path,
  message,
  ...(line === undefined ? {} : { line }),
  ...(column === undefined ? {} : { column }),
})

const resolveDestination = (
  root: string,
  source: string,
  destination: string,
): { absolute: string; fragment?: string } | null => {
  if (destination.startsWith('/')) return null
  const hash = destination.indexOf('#')
  const beforeHash = hash >= 0 ? destination.slice(0, hash) : destination
  const rawFragment = hash >= 0 ? destination.slice(hash + 1) : undefined
  const query = beforeHash.indexOf('?')
  const rawPath = query >= 0 ? beforeHash.slice(0, query) : beforeHash
  try {
    const decodedPath = decodeURIComponent(rawPath)
    const fragment = rawFragment === undefined ? undefined : decodeURIComponent(rawFragment)
    const absolute = decodedPath
      ? resolve(dirname(source), decodedPath)
      : resolve(source)
    if (!isWithinRoot(root, absolute)) return null
    return { absolute, ...(fragment === undefined ? {} : { fragment }) }
  } catch {
    return null
  }
}

const checkMetadata = (
  path: string,
  content: string,
): QualityDiagnostic[] => {
  if (!isGovernedArtifact(path)) return []
  const diagnostics: QualityDiagnostic[] = []
  if (isValidationReport(path)) {
    const state = metadata(content, 'Estado de entrega')
    if (!state || !deliveryStates.has(state)) {
      diagnostics.push(diagnostic(
        'DOC_DELIVERY_STATUS',
        path,
        `Estado de entrega ausente o no permitido: ${state ?? 'ausente'}.`,
      ))
    }
    if (state === 'IMPLEMENTED' && pendingMetadata(metadata(content, 'Fecha de implementación'))) {
      diagnostics.push(diagnostic('DOC_APPROVAL_METADATA', path, 'Una entrega IMPLEMENTED debe registrar su fecha de implementación.'))
    }
    if (state === 'VALIDATED') {
      for (const field of ['Fecha de validación', 'Aceptado por', 'Evidencia de aceptación']) {
        if (pendingMetadata(metadata(content, field))) {
          diagnostics.push(diagnostic('DOC_APPROVAL_METADATA', path, `Una entrega VALIDATED debe completar ${field}.`))
        }
      }
    }
    return diagnostics
  }

  const state = metadata(content, 'Estado documental')
  if (!state || !documentStates.has(state)) {
    diagnostics.push(diagnostic(
      'DOC_DOCUMENT_STATUS',
      path,
      `Estado documental ausente o no permitido: ${state ?? 'ausente'}.`,
    ))
    return diagnostics
  }
  const version = metadata(content, 'Versión')
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    diagnostics.push(diagnostic('DOC_APPROVAL_METADATA', path, 'La versión debe utilizar el formato numérico X.Y.Z.'))
  }
  if (state === 'APPROVED') {
    for (const field of ['Aprobado por', 'Fecha de aprobación', 'Evidencia de aprobación']) {
      if (pendingMetadata(metadata(content, field))) {
        diagnostics.push(diagnostic('DOC_APPROVAL_METADATA', path, `Un documento APPROVED debe completar ${field}.`))
      }
    }
  }
  return diagnostics
}

export const checkDocumentation = async (root: string): Promise<QualityRun> => {
  const absoluteRoot = resolve(root)
  const markdownFiles = await collectFiles(absoluteRoot, (path) => extname(path).toLowerCase() === '.md')
  const markdownPaths = markdownFiles.map((path) => repositoryPath(absoluteRoot, path))
  const diagnostics: QualityDiagnostic[] = []
  const documents = new Map<string, { content: string; anchors: Set<string>; links: ReturnType<typeof parseMarkdown>['links'] }>()

  for (const absolute of markdownFiles) {
    const path = repositoryPath(absoluteRoot, absolute)
    const content = await readFile(absolute, 'utf8')
    const parsed = parseMarkdown(content)
    documents.set(path, { content, anchors: parsed.anchors, links: parsed.links })
    diagnostics.push(...checkMetadata(path, content))
  }

  for (const required of requiredDocumentationFiles) {
    if (!await isRegularFile(resolve(absoluteRoot, required))) {
      diagnostics.push(diagnostic('DOC_REQUIRED_FILE', required, 'Falta un documento obligatorio.'))
    }
  }

  const linkedPaths = new Map<string, Set<string>>()
  for (const [path, document] of documents) {
    const source = resolve(absoluteRoot, path)
    const links = new Set<string>()
    linkedPaths.set(path, links)
    for (const link of document.links) {
      if (!link.destination) {
        diagnostics.push(diagnostic('DOC_LINK_UNCHECKABLE', path, 'El destino del enlace no puede interpretarse de forma determinista.', link.line, link.column))
        continue
      }
      if (externalDestination(link.destination)) continue
      const resolved = resolveDestination(absoluteRoot, source, link.destination)
      if (!resolved) {
        diagnostics.push(diagnostic('DOC_LINK_UNCHECKABLE', path, `El enlace local escapa de la raíz o tiene una codificación inválida: ${link.destination}.`, link.line, link.column))
        continue
      }
      const inspected = await inspectPath(absoluteRoot, resolved.absolute)
      if (!inspected.exists || !inspected.insideRoot) {
        diagnostics.push(diagnostic('DOC_LINK_TARGET', path, `No existe el destino local ${link.destination}.`, link.line, link.column))
        continue
      }
      let target = resolved.absolute
      if (inspected.isDirectory) target = resolve(target, 'README.md')
      const targetPath = repositoryPath(absoluteRoot, target)
      links.add(targetPath)
      if (resolved.fragment) {
        if (extname(target).toLowerCase() !== '.md' || !await isRegularFile(target)) {
          diagnostics.push(diagnostic('DOC_LINK_UNCHECKABLE', path, `No se puede comprobar el ancla de ${link.destination}.`, link.line, link.column))
          continue
        }
        let targetDocument = documents.get(targetPath)
        if (!targetDocument) {
          const content = await readFile(target, 'utf8')
          const parsed = parseMarkdown(content)
          targetDocument = { content, anchors: parsed.anchors, links: parsed.links }
          documents.set(targetPath, targetDocument)
        }
        if (!targetDocument.anchors.has(resolved.fragment)) {
          diagnostics.push(diagnostic('DOC_LINK_ANCHOR', path, `No existe el ancla #${resolved.fragment} en ${targetPath}.`, link.line, link.column))
        }
      }
    }
  }

  const dynamicEntries = expectedDynamicIndexEntries(markdownPaths)
  const allEntries = new Map<string, string[]>()
  for (const [index, entries] of Object.entries(staticIndexEntries)) {
    allEntries.set(index, [...entries])
  }
  for (const [index, entries] of Object.entries(dynamicEntries)) {
    allEntries.set(index, [...(allEntries.get(index) ?? []), ...entries])
  }
  for (const [index, entries] of allEntries) {
    const links = linkedPaths.get(index) ?? new Set<string>()
    for (const entry of new Set(entries)) {
      if (!links.has(entry)) {
        diagnostics.push(diagnostic('DOC_INDEX_ENTRY', index, `El índice no enlaza el artefacto requerido ${entry}.`))
      }
    }
  }

  return {
    label: 'docs:check',
    diagnostics,
    checkedFiles: markdownFiles.length,
  }
}

export const main = async (
  root = process.cwd(),
  io?: QualityIo,
): Promise<number> => runQualityMain(() => checkDocumentation(root), io)

if (isExecutedModule(import.meta.url)) {
  process.exitCode = await main()
}
