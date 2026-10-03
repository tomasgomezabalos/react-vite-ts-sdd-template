import {
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
import { createHash } from 'node:crypto'

export type QualityFixture = {
  root: string
  write: (path: string, content: string) => Promise<void>
  read: (path: string) => Promise<string>
  cleanup: () => Promise<void>
}

export const createQualityFixture = async (): Promise<QualityFixture> => {
  const root = await mkdtemp(join(tmpdir(), 'quality-check-'))
  const write = async (path: string, content: string) => {
    const absolute = resolve(root, path)
    await mkdir(dirname(absolute), { recursive: true })
    await writeFile(absolute, content)
  }
  return {
    root,
    write,
    read: (path) => readFile(resolve(root, path), 'utf8'),
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

export type FileSnapshot = Record<
  string,
  {
    hash: string
    mode: number
    mtimeMs: number
  }
>

export const snapshotFiles = async (root: string): Promise<FileSnapshot> => {
  const entries: FileSnapshot = {}
  const walk = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name)
      if (entry.isDirectory()) await walk(absolute)
      else if (entry.isFile()) {
        const details = await stat(absolute)
        const content = await readFile(absolute)
        entries[relative(root, absolute)] = {
          hash: createHash('sha256').update(content).digest('hex'),
          mode: details.mode & 0o777,
          mtimeMs: details.mtimeMs,
        }
      }
    }
  }
  await walk(root)
  return Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  )
}

const approvedDocument = (title: string): string => `# ${title}

**Estado documental:** APPROVED

**Versión:** 1.0.0

**Fecha:** 2026-08-28

**Aprobado por:** Tomás

**Fecha de aprobación:** 2026-08-28

**Evidencia de aprobación:** Prueba fixture.
`

export const populateDocumentationFixture = async (
  fixture: QualityFixture,
): Promise<void> => {
  await fixture.write('AGENTS.md', '# Agents\n')
  await fixture.write('README.md', '# Readme\n')
  await fixture.write('specs/README.md', '# Producto\n')
  await fixture.write('docs/architecture/README.md', '# Arquitectura\n')
  await fixture.write(
    'docs/platform/README.md',
    `# Plataforma

[PLAT-001](specs/001-enrutamiento-base-spa/spec.md)
[PLAT-002](specs/002-carga-diferida-rutas/spec.md)
[Enmienda](specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md)
`,
  )
  await fixture.write(
    'docs/platform/specs/001-enrutamiento-base-spa/spec.md',
    '# Histórico 1\n',
  )
  await fixture.write(
    'docs/platform/specs/002-carga-diferida-rutas/spec.md',
    '# Histórico 2\n',
  )
  await fixture.write(
    'docs/platform/specs/002-carga-diferida-rutas/amendment-001-obligatoriedad-paginas.md',
    '# Enmienda\n',
  )
  await fixture.write(
    'docs/sdd/README.md',
    `# SDD

[Constitución](constitution.md)
[Workflow](workflow.md)
[Cambios](change-policy.md)
[ADR](templates/adr.md)
[Feature](templates/feature-spec.md)
[Visión](templates/product-vision.md)
[Quick](templates/quick-change.md)
[Plan](templates/technical-plan.md)
[Informe](templates/validation-report.md)
`,
  )
  for (const path of [
    'docs/sdd/change-policy.md',
    'docs/sdd/constitution.md',
    'docs/sdd/workflow.md',
  ]) {
    await fixture.write(path, approvedDocument(path))
  }
  for (const path of [
    'docs/sdd/templates/adr.md',
    'docs/sdd/templates/feature-spec.md',
    'docs/sdd/templates/product-vision.md',
    'docs/sdd/templates/quick-change.md',
    'docs/sdd/templates/technical-plan.md',
    'docs/sdd/templates/validation-report.md',
  ]) {
    await fixture.write(path, `# Template ${path}\n\n<Aprobado por>\n`)
  }
}

export const approvedFixtureDocument = approvedDocument
