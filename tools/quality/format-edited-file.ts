import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve } from 'node:path'
import { isExecutedModule } from './output.ts'

export type FormatHookResult = { code: 0 | 2; stderr?: string }

const formattableExtensions = new Set(['.ts', '.tsx', '.js', '.scss', '.json'])

const editedFilePath = (input: string): string | undefined => {
  try {
    const parsed: unknown = JSON.parse(input)
    const toolInput = (parsed as { tool_input?: { file_path?: unknown } })
      ?.tool_input
    const filePath = toolInput?.file_path
    return typeof filePath === 'string' && filePath !== ''
      ? filePath
      : undefined
  } catch {
    return undefined
  }
}

const isInsideProject = (projectRoot: string, filePath: string): boolean => {
  const path = relative(projectRoot, filePath)
  return path !== '' && !path.startsWith('..') && !isAbsolute(path)
}

export const formatEditedFile = (
  input: string,
  projectRoot: string,
): FormatHookResult => {
  const requested = editedFilePath(input)
  if (requested === undefined) return { code: 0 }

  const filePath = resolve(projectRoot, requested)
  const prettier = resolve(
    projectRoot,
    'node_modules/prettier/bin/prettier.cjs',
  )
  if (
    !formattableExtensions.has(extname(filePath)) ||
    !isInsideProject(projectRoot, filePath) ||
    !existsSync(filePath) ||
    !existsSync(prettier)
  ) {
    return { code: 0 }
  }

  const run = spawnSync(process.execPath, [prettier, '--write', filePath], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  if (run.status === 0) return { code: 0 }
  return {
    code: 2,
    stderr: run.stderr || run.error?.message || 'Prettier no pudo formatear.',
  }
}

if (isExecutedModule(import.meta.url)) {
  const result = formatEditedFile(
    readFileSync(0, 'utf8'),
    process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
  )
  if (result.stderr) process.stderr.write(`${result.stderr.trimEnd()}\n`)
  process.exitCode = result.code
}
