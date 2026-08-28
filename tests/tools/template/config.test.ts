// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ConfigError,
  configDigest,
  hashText,
  validateProjectConfig,
} from '../../../tools/template/config.ts'
import {
  readExampleConfig,
  readFixtureManifest,
  repositoryRoot,
} from './helpers/project-fixture.ts'
import type { ProjectConfig } from '../../../tools/template/types.ts'

describe('project configuration', () => {
  it('accepts the reviewed example deterministically', async () => {
    const config = await readExampleConfig()

    const first = validateProjectConfig(config)
    const second = validateProjectConfig(JSON.parse(JSON.stringify(config)))

    expect(configDigest(first)).toBe(configDigest(second))
  })

  it('keeps schema and example top-level fields aligned', async () => {
    const schema = JSON.parse(await readFile(
      resolve(repositoryRoot, 'tools/template/project.schema.json'),
      'utf8',
    )) as { required: string[] }
    const config = await readExampleConfig() as ProjectConfig & { $schema?: string }

    expect(Object.keys(config).filter((key) => key !== '$schema').sort())
      .toEqual([...schema.required].sort())
  })

  it('keeps source baseline or derived state hashes synchronized', async () => {
    const manifest = await readFixtureManifest()
    let expected: Record<string, string | null> = manifest.managedFiles
    try {
      const state = JSON.parse(await readFile(
        resolve(repositoryRoot, '.template-state.json'),
        'utf8',
      )) as { managedFiles: Record<string, string | null> }
      expected = state.managedFiles
    } catch {
      // La ausencia de estado identifica la plantilla fuente.
    }

    for (const [path, expectedHash] of Object.entries(expected)) {
      if (expectedHash === null) {
        await expect(readFile(resolve(repositoryRoot, path), 'utf8')).rejects.toMatchObject({
          code: 'ENOENT',
        })
      } else {
        const content = await readFile(resolve(repositoryRoot, path), 'utf8')
        expect(hashText(content), path).toBe(expectedHash)
      }
    }
  })

  it('rejects unsuitable projects, invalid packages and secret fields', async () => {
    const config = await readExampleConfig() as unknown as Record<string, unknown>
    const invalid = JSON.parse(JSON.stringify(config)) as {
      identity: { packageName: string; apiToken?: string }
      derivation: { suitability: { status: string } }
    }
    invalid.identity.packageName = 'Invalid Package'
    invalid.identity.apiToken = 'must-not-be-here'
    invalid.derivation.suitability.status = 'not-suitable'

    expect(() => validateProjectConfig(invalid)).toThrow(ConfigError)
    expect(() => validateProjectConfig(invalid)).toThrow(/apiToken|packageName|idónea/)
  })

  it('rejects a pending suitability criterion', async () => {
    const config = JSON.parse(JSON.stringify(await readExampleConfig())) as ProjectConfig
    config.derivation.suitability.criteria.serverRendering = {
      decision: 'pending',
      rationale: 'Falta confirmar el requisito.',
      responsible: 'Arquitectura',
      resolutionCondition: 'Cerrar la decisión de renderizado.',
    }

    expect(() => validateProjectConfig(config)).toThrow(/serverRendering sigue pendiente/)
  })
})
