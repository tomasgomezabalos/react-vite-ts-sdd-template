import { dirname, extname, resolve } from 'node:path'
import * as ts from 'typescript'
import { collectFiles, isWithinRoot } from './filesystem.ts'

export type ImportReference = {
  specifier?: string
  line: number
  column: number
}

export type SourceImports = {
  source: string
  references: ImportReference[]
}

export type ImportAnalysis = {
  compilerOptions: ts.CompilerOptions
  configuredAliases: string[]
  sources: SourceImports[]
}

const position = (
  sourceFile: ts.SourceFile,
  node: ts.Node,
): Pick<ImportReference, 'line' | 'column'> => {
  const location = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  )
  return { line: location.line + 1, column: location.character + 1 }
}

const literal = (node: ts.Node | undefined): string | undefined => {
  if (!node) return undefined
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text
  return undefined
}

export const extractImportReferences = (
  sourceFile: ts.SourceFile,
): ImportReference[] => {
  const references: ImportReference[] = []
  const add = (node: ts.Node, specifier?: string) => {
    references.push({
      ...position(sourceFile, node),
      ...(specifier ? { specifier } : {}),
    })
  }
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier)
        add(node.moduleSpecifier, literal(node.moduleSpecifier))
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      add(node, literal(node.arguments[0]))
    } else if (ts.isImportTypeNode(node)) {
      const argument = ts.isLiteralTypeNode(node.argument)
        ? node.argument.literal
        : node.argument
      add(node, literal(argument))
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return references
}

const loadCompilerOptions = (
  root: string,
  configPath: string,
): {
  options: ts.CompilerOptions
  aliases: string[]
} => {
  const absoluteConfig = resolve(root, configPath)
  const read = ts.readConfigFile(absoluteConfig, (path) =>
    ts.sys.readFile(path),
  )
  if (read.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(read.error.messageText, '\n'),
    )
  }
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    dirname(absoluteConfig),
  )
  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors
        .map((error) =>
          ts.flattenDiagnosticMessageText(error.messageText, '\n'),
        )
        .join('\n'),
    )
  }
  return {
    options: parsed.options,
    aliases: Object.keys(parsed.options.paths ?? {}),
  }
}

export const analyzeImports = async (
  root: string,
  configPath = 'tsconfig.app.json',
): Promise<ImportAnalysis> => {
  const absoluteRoot = resolve(root)
  const { options, aliases } = loadCompilerOptions(absoluteRoot, configPath)
  const sourceRoot = resolve(absoluteRoot, 'src')
  const files = await collectFiles(sourceRoot, (path) =>
    ['.ts', '.tsx'].includes(extname(path)),
  )
  const sources = files.map((source) => {
    const content = ts.sys.readFile(source)
    if (content === undefined) throw new Error(`No se puede leer ${source}.`)
    const kind =
      extname(source) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(
      source,
      content,
      options.target ?? ts.ScriptTarget.ESNext,
      true,
      kind,
    )
    return { source, references: extractImportReferences(sourceFile) }
  })
  return { compilerOptions: options, configuredAliases: aliases, sources }
}

const aliasMatches = (specifier: string, pattern: string): boolean => {
  if (!pattern.includes('*')) return specifier === pattern
  const [prefix = '', suffix = ''] = pattern.split('*')
  return specifier.startsWith(prefix) && specifier.endsWith(suffix)
}

const fallbackCandidates = (
  containingFile: string,
  specifier: string,
): string[] => {
  const base = resolve(dirname(containingFile), specifier)
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    `${base}.scss`,
    `${base}.css`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
    resolve(base, 'index.js'),
    resolve(base, 'index.jsx'),
  ]
}

export type ResolvedImport = {
  internal: boolean
  unresolvedInternal: boolean
  path?: string
}

export const resolveImport = (
  root: string,
  containingFile: string,
  specifier: string,
  compilerOptions: ts.CompilerOptions,
  aliases: string[],
): ResolvedImport => {
  const sourceRoot = resolve(root, 'src')
  const resolvedModule = ts.resolveModuleName(
    specifier,
    containingFile,
    compilerOptions,
    ts.sys,
  ).resolvedModule
  if (resolvedModule) {
    const path = resolve(resolvedModule.resolvedFileName)
    if (isWithinRoot(sourceRoot, path))
      return { internal: true, unresolvedInternal: false, path }
    return { internal: false, unresolvedInternal: false }
  }

  if (specifier.startsWith('.')) {
    const candidate = fallbackCandidates(containingFile, specifier).find(
      (path) => ts.sys.fileExists(path),
    )
    return candidate && isWithinRoot(sourceRoot, candidate)
      ? { internal: true, unresolvedInternal: false, path: candidate }
      : { internal: true, unresolvedInternal: true }
  }
  if (
    specifier.startsWith('/') ||
    aliases.some((pattern) => aliasMatches(specifier, pattern))
  ) {
    return { internal: true, unresolvedInternal: true }
  }
  return { internal: false, unresolvedInternal: false }
}
