import {
  lstat,
  readdir,
  realpath,
  stat,
} from 'node:fs/promises'
import {
  relative,
  resolve,
  sep,
} from 'node:path'

const ignoredDirectories = new Set([
  '.agents',
  '.codex',
  '.git',
  '.template-transaction',
  'coverage',
  'dist',
  'node_modules',
])

export const toPortablePath = (value: string): string =>
  value.split(sep).join('/')

export const isWithinRoot = (root: string, candidate: string): boolean => {
  const child = relative(resolve(root), resolve(candidate))
  return child === '' || (!child.startsWith(`..${sep}`) && child !== '..' && !child.startsWith(sep))
}

export const repositoryPath = (root: string, absolutePath: string): string =>
  toPortablePath(relative(resolve(root), resolve(absolutePath)))

export const collectFiles = async (
  root: string,
  predicate: (path: string) => boolean,
): Promise<string[]> => {
  const files: string[] = []
  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
      const absolute = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) await walk(absolute)
      else if (entry.isFile() && predicate(absolute)) files.push(absolute)
    }
  }
  await walk(resolve(root))
  return files.sort((left, right) => left.localeCompare(right))
}

export type InspectedPath = {
  exists: boolean
  insideRoot: boolean
  isDirectory: boolean
}

export const inspectPath = async (
  root: string,
  candidate: string,
): Promise<InspectedPath> => {
  if (!isWithinRoot(root, candidate)) {
    return { exists: false, insideRoot: false, isDirectory: false }
  }
  try {
    const details = await stat(candidate)
    const realRoot = await realpath(root)
    const realCandidate = await realpath(candidate)
    return {
      exists: true,
      insideRoot: isWithinRoot(realRoot, realCandidate),
      isDirectory: details.isDirectory(),
    }
  } catch {
    return { exists: false, insideRoot: true, isDirectory: false }
  }
}

export const isRegularFile = async (path: string): Promise<boolean> => {
  try {
    return (await lstat(path)).isFile()
  } catch {
    return false
  }
}
