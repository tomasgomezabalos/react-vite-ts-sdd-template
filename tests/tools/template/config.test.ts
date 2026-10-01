// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ConfigError,
  configDigest,
  effectiveProjectConfig,
  suggestPackageName,
  validateProjectConfig,
} from '../../../tools/template/config.ts'
import {
  readExampleConfig,
  repositoryRoot,
} from './helpers/project-fixture.ts'
import type { ProjectConfig } from '../../../tools/template/types.ts'

describe('project configuration', () => {
  it('accepts the minimal example and derives deterministic defaults', async () => {
    const config = await readExampleConfig()

    const first = validateProjectConfig(config)
    const second = validateProjectConfig(JSON.parse(JSON.stringify(config)))

    expect(configDigest(first)).toBe(configDigest(second))
    expect(effectiveProjectConfig(first)).toMatchObject({
      identity: {
        displayName: 'Example Project',
        packageName: 'example-project',
        packageVersion: '0.1.0',
        htmlTitle: 'Example Project',
      },
    })
  })

  it('suggests an npm package name deterministically', () => {
    expect(suggestPackageName('  Ágil / Café 2026  ')).toBe('agil-cafe-2026')
    expect(suggestPackageName('---')).toBe('')
    expect(suggestPackageName('My.Project')).toBe('my-project')
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

  it('rejects legacy fields, invalid packages and secret-shaped keys', async () => {
    const invalid = {
      ...await readExampleConfig(),
      identity: {
        displayName: 'Example',
        packageName: 'Invalid Package',
        apiToken: 'must-not-be-here',
      },
      productVision: {},
    }

    expect(() => validateProjectConfig(invalid)).toThrow(ConfigError)
    expect(() => validateProjectConfig(invalid)).toThrow(
      /apiToken|packageName|productVision/,
    )
  })

  it('rejects the former schema version instead of migrating it', async () => {
    const legacy = {
      ...await readExampleConfig(),
      schemaVersion: 1,
    }

    expect(() => validateProjectConfig(legacy)).toThrow(/contrato v1 ya no es compatible/)
  })
})
