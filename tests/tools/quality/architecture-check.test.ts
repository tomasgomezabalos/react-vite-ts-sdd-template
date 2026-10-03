// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import * as ts from 'typescript'
import {
  checkArchitecture,
  main,
} from '../../../tools/quality/architecture-check.ts'
import { extractImportReferences } from '../../../tools/quality/imports.ts'
import {
  createQualityFixture,
  snapshotFiles,
} from './helpers/quality-fixture.ts'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

const configure = async (
  fixture: Awaited<ReturnType<typeof createQualityFixture>>,
) => {
  await fixture.write(
    'tsconfig.app.json',
    JSON.stringify({
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
        strict: true,
        noEmit: true,
      },
      include: ['src'],
    }),
  )
}

describe('architecture quality check', () => {
  it('accepts descending dependencies, aliases and public page entrypoints without writing', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await configure(fixture)
    await fixture.write(
      'src/main.tsx',
      "import './app/App'\nimport './index.scss'\n",
    )
    await fixture.write('src/index.scss', '')
    await fixture.write(
      'src/app/App/index.ts',
      "export { page } from '../../pages/Home'\n",
    )
    await fixture.write(
      'src/pages/Home/index.ts',
      "import { feature } from '../../features/Search'\nexport const page = feature\n",
    )
    await fixture.write(
      'src/features/Search/index.ts',
      "import { entity } from '../../entities/User'\nexport const feature = entity\n",
    )
    await fixture.write(
      'src/entities/User/index.ts',
      "import { shared } from '@/shared/value'\nexport const entity = shared\n",
    )
    await fixture.write('src/shared/value.ts', 'export const shared = true\n')
    await fixture.write('src/i18n/config.ts', "import '../locales/en/value'\n")
    await fixture.write(
      'src/locales/en/value.ts',
      'export const value = true\n',
    )
    const before = await snapshotFiles(fixture.root)

    const result = await checkArchitecture(fixture.root)

    expect(result.diagnostics).toEqual([])
    expect(result.checkedFiles).toBe(8)
    expect(await snapshotFiles(fixture.root)).toEqual(before)
  })

  it('reports upward, cross-page, private, unresolved and dynamic imports', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await configure(fixture)
    await fixture.write('src/shared/upward.ts', "import '../entities/User'\n")
    await fixture.write(
      'src/entities/User/index.ts',
      'export const user = true\n',
    )
    await fixture.write(
      'src/pages/A/index.ts',
      "import { b } from '../B'\nexport const a = b\n",
    )
    await fixture.write(
      'src/pages/A/components/Private.ts',
      'export const privateValue = true\n',
    )
    await fixture.write('src/pages/B/index.ts', 'export const b = true\n')
    await fixture.write(
      'src/app/App/index.ts',
      `import '../../pages/A/components/Private'
import '@/shared/missing'
const target = '../../pages/A'
void import(target)
`,
    )

    const result = await checkArchitecture(fixture.root)
    const codes = result.diagnostics.map((entry) => entry.code)

    expect(codes).toEqual(
      expect.arrayContaining([
        'ARCH_LAYER_DIRECTION',
        'ARCH_PAGE_TO_PAGE',
        'ARCH_PRIVATE_PAGE_IMPORT',
        'ARCH_INTERNAL_UNRESOLVED',
        'ARCH_DYNAMIC_UNCHECKABLE',
      ]),
    )
  })

  it('extracts imports, reexports and import types with source locations', () => {
    const source = ts.createSourceFile(
      'fixture.ts',
      `import value from './value'
export { other } from './other'
type Loaded = import('./types').Loaded
void import('./lazy')
`,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    )

    expect(extractImportReferences(source)).toEqual([
      expect.objectContaining({ specifier: './value', line: 1 }),
      expect.objectContaining({ specifier: './other', line: 2 }),
      expect.objectContaining({ specifier: './types', line: 3 }),
      expect.objectContaining({ specifier: './lazy', line: 4 }),
    ])
  })

  it('returns code 1 for violations and code 2 when configuration is unreadable', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await configure(fixture)
    await fixture.write('src/pages/A/index.ts', "import '../B'\n")
    await fixture.write('src/pages/B/index.ts', '')
    const stderr: string[] = []

    expect(
      await main(fixture.root, {
        stdout: () => undefined,
        stderr: (value) => stderr.push(value),
      }),
    ).toBe(1)
    expect(stderr.join('')).toContain('ARCH_PAGE_TO_PAGE')

    await fixture.write('tsconfig.app.json', '{ invalid')
    expect(
      await main(fixture.root, {
        stdout: () => undefined,
        stderr: (value) => stderr.push(value),
      }),
    ).toBe(2)
    expect(stderr.join('')).toContain('QUALITY_INTERNAL_ERROR')
  })
})
