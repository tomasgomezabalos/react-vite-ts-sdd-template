// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import {
  checkDocumentation,
  main,
} from '../../../tools/quality/docs-check.ts'
import {
  approvedFixtureDocument,
  createQualityFixture,
  populateDocumentationFixture,
  snapshotFiles,
} from './helpers/quality-fixture.ts'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

describe('documentation quality check', () => {
  it('accepts a valid repository without modifying it', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await populateDocumentationFixture(fixture)
    const before = await snapshotFiles(fixture.root)

    const result = await checkDocumentation(fixture.root)

    expect(result.diagnostics).toEqual([])
    expect(result.checkedFiles).toBeGreaterThan(10)
    expect(await snapshotFiles(fixture.root)).toEqual(before)
  })

  it('reports missing targets, anchors, unsafe paths and required files', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await populateDocumentationFixture(fixture)
    await fixture.write('README.md', `# Readme

[missing](missing.md)
[anchor](docs/sdd/constitution.md#does-not-exist)
[outside](/absolute.md)
`)
    await fixture.write('docs/sdd/templates/adr.md', '')

    const result = await checkDocumentation(fixture.root)

    expect(result.diagnostics.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'DOC_LINK_TARGET',
      'DOC_LINK_ANCHOR',
      'DOC_LINK_UNCHECKABLE',
    ]))
  })

  it('reports invalid current states, approval metadata and missing index entries', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await populateDocumentationFixture(fixture)
    await fixture.write('docs/architecture/decisions/0009-test.md', approvedFixtureDocument('ADR test').replace('APPROVED', 'READY'))
    await fixture.write('specs/product-vision.md', approvedFixtureDocument('Visión').replace('Tomás', 'Pendiente'))

    const result = await checkDocumentation(fixture.root)

    expect(result.diagnostics.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'DOC_DOCUMENT_STATUS',
      'DOC_APPROVAL_METADATA',
      'DOC_INDEX_ENTRY',
    ]))
  })

  it('validates implementation and acceptance metadata in delivery reports', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await populateDocumentationFixture(fixture)
    await fixture.write('docs/platform/specs/003-test/spec.md', approvedFixtureDocument('Spec'))
    await fixture.write('docs/platform/specs/003-test/validation-report.md', `# Informe

**Estado de entrega:** VALIDATED

**Fecha de implementación:** 2026-08-28

**Fecha de validación:** Pendiente

**Aceptado por:** Pendiente

**Evidencia de aceptación:** Pendiente
`)
    await fixture.write('docs/platform/README.md', `${await fixture.read('docs/platform/README.md')}
[Spec](specs/003-test/spec.md)
[Informe](specs/003-test/validation-report.md)
`)

    const result = await checkDocumentation(fixture.root)

    expect(result.diagnostics.filter((entry) => entry.code === 'DOC_APPROVAL_METADATA')).toHaveLength(3)
  })

  it('returns deterministic CLI output and exit codes', async () => {
    const fixture = await createQualityFixture()
    cleanups.push(fixture.cleanup)
    await populateDocumentationFixture(fixture)
    const stdout: string[] = []
    const stderr: string[] = []

    expect(await main(fixture.root, {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    })).toBe(0)
    expect(stdout.join('')).toMatch(/docs:check: OK/)

    await fixture.write('README.md', '[z](z.md)\n[a](a.md)\n')
    expect(await main(fixture.root, {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    })).toBe(1)
    const linkFailures = stderr.join('').split('\n').filter((line) => line.includes('DOC_LINK_TARGET'))
    expect(linkFailures[0]).toContain('z.md')
    expect(linkFailures[1]).toContain('a.md')
  })
})
