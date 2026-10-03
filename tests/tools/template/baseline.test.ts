// @vitest-environment node

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { removeTemplateOnlyBlocks } from '../../../tools/template/managed-files.ts'
import { loadBaselineManifest } from '../../../tools/template/project.ts'
import { repositoryRoot } from './helpers/project-fixture.ts'

describe('template baseline manifest', () => {
  it('keeps the baseline hashes synchronized with managed files', async () => {
    const manifest = await loadBaselineManifest()

    expect(manifest.baselineId).toBe(
      'react-vite-ts-sdd-template@2026-10-03-plat-011.1',
    )
    for (const [path, expectedHash] of Object.entries(manifest.managedFiles)) {
      const content = await readFile(resolve(repositoryRoot, path))
      expect(createHash('sha256').update(content).digest('hex'), path).toBe(
        expectedHash,
      )
    }
  })

  it('declares the template-only paths that a derivation must not receive', async () => {
    const manifest = await loadBaselineManifest()

    expect(manifest.derivation.exclude).toEqual(
      expect.arrayContaining([
        'tools/template/**',
        'tests/tools/template/**',
        'project.config.json',
        '.template-state.json',
        '.claude/settings.local.json',
      ]),
    )
  })

  it('removes only the template-only blocks from AGENTS.md', async () => {
    const agents = await readFile(resolve(repositoryRoot, 'AGENTS.md'), 'utf8')
    const derived = removeTemplateOnlyBlocks(agents)

    expect(agents).toContain('template-only:start')
    expect(derived).not.toContain('template-only')
    expect(derived).not.toContain('template:doctor')
    expect(derived).toContain('docs/platform/')
    expect(removeTemplateOnlyBlocks(derived)).toBe(derived)
  })

  it('rejects unbalanced template-only markers', () => {
    expect(() =>
      removeTemplateOnlyBlocks('a\n<!-- template-only:start -->\nb\n'),
    ).toThrow(/desbalanceados/)
  })
})
