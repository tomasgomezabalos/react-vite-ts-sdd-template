import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashText } from '../../../../tools/template/config.ts'
import type {
  BaselineManifest,
  ProjectConfig,
} from '../../../../tools/template/types.ts'

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
)

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, 'utf8')) as T

export const readExampleConfig = async (): Promise<ProjectConfig> =>
  readJson<ProjectConfig>(resolve(repositoryRoot, 'tools/template/project.config.example.json'))

export const readFixtureManifest = async (): Promise<BaselineManifest> =>
  readJson<BaselineManifest>(resolve(repositoryRoot, 'tools/template/baseline-manifest.json'))

const copy = async (source: string, destination: string) => {
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(source, destination)
}

export const createProjectFixture = async (): Promise<{
  target: string
  configPath: string
  config: ProjectConfig
  manifest: BaselineManifest
  cleanup: () => Promise<void>
}> => {
  const target = await mkdtemp(join(tmpdir(), 'template-project-'))
  const sourceManifest = await readFixtureManifest()
  const required = new Set([
    ...Object.keys(sourceManifest.managedFiles),
    '.nvmrc',
    'docs/platform/README.md',
  ])
  const managedFiles: Record<string, string> = {}
  for (const path of required) {
    try {
      const content = await readFile(resolve(repositoryRoot, path), 'utf8')
      await copy(resolve(repositoryRoot, path), resolve(target, path))
      if (path !== '.nvmrc' && path !== 'docs/platform/README.md') {
        managedFiles[path] = hashText(content)
      }
    } catch {
      // Un archivo eliminado de forma controlada no forma parte de la fixture actual.
    }
  }
  const manifest: BaselineManifest = { ...sourceManifest, managedFiles }
  const config = await readExampleConfig()
  const configPath = resolve(target, 'project.config.json')
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  return {
    target,
    configPath,
    config,
    manifest,
    cleanup: () => rm(target, { recursive: true, force: true }),
  }
}

export const writeFixtureConfig = async (
  configPath: string,
  config: ProjectConfig,
) => writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)

type SnapshotEntry = {
  hash: string
  mode: number
  mtimeMs: number
}

export const snapshotProject = async (
  target: string,
): Promise<Record<string, SnapshotEntry>> => {
  const snapshot: Record<string, SnapshotEntry> = {}
  const walk = async (directory: string) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue
      const absolute = resolve(directory, entry.name)
      if (entry.isDirectory()) await walk(absolute)
      else {
        const details = await stat(absolute)
        snapshot[relative(target, absolute)] = {
          hash: hashText(await readFile(absolute, 'utf8')),
          mode: details.mode & 0o777,
          mtimeMs: details.mtimeMs,
        }
      }
    }
  }
  await walk(target)
  return Object.fromEntries(Object.entries(snapshot).sort(([left], [right]) =>
    left.localeCompare(right)))
}
