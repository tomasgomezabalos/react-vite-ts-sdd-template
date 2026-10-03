// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../../..')

describe('quality workflow', () => {
  it('runs the canonical quality gate with the pinned project runtime', async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/quality.yml'),
      'utf8',
    )

    expect(workflow).toContain('push:')
    expect(workflow).toContain('- main')
    expect(workflow).toContain('pull_request:')
    expect(workflow).toContain('contents: read')
    expect(workflow).toContain('cancel-in-progress: true')
    expect(workflow).toContain(
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    )
    expect(workflow).toContain(
      'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    )
    expect(workflow).toContain('node-version-file: .nvmrc')
    expect(workflow).toContain('cache-dependency-path: package-lock.json')

    const commands = [...workflow.matchAll(/^\s+run:\s+(.+)$/gm)].map(
      (match) => match[1],
    )
    expect(commands).toEqual(['npm ci', 'npm run check', 'npm run test:tools'])
    expect(workflow).toContain(
      "if: github.repository == 'tomasgomezabalos/react-vite-ts-sdd-template'",
    )
    expect(workflow).not.toMatch(/secrets\.|npm publish|deploy/i)
  })
})

describe('security automation', () => {
  it('runs a separate scheduled audit without touching the quality gate', async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/security.yml'),
      'utf8',
    )

    expect(workflow).toContain('schedule:')
    expect(workflow).toContain('contents: read')
    expect(workflow).toContain(
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    )
    expect(workflow).toContain(
      'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    )
    expect(workflow).toContain('node-version-file: .nvmrc')
    expect(workflow).not.toMatch(/secrets\.|npm publish|deploy/i)

    const commands = [...workflow.matchAll(/^\s+run:\s+(.+)$/gm)].map(
      (match) => match[1],
    )
    expect(commands).toEqual([
      'npm ci',
      'npm audit --omit=dev --audit-level=high',
    ])

    const usesLines = [...workflow.matchAll(/^\s+uses:\s+(\S+)(.*)$/gm)]
    for (const [, action, comment] of usesLines) {
      expect(action, action).toMatch(/@[0-9a-f]{40}$/)
      expect(comment, action).toMatch(/# v\d/)
    }
  })

  it('does not add npm audit to the local quality gate', async () => {
    const pkg = JSON.parse(
      await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>
    }

    expect(pkg.scripts.check).not.toContain('audit')
  })

  it('schedules weekly grouped updates for npm and GitHub Actions', async () => {
    const config = await readFile(
      resolve(repositoryRoot, '.github/dependabot.yml'),
      'utf8',
    )

    expect(config).toContain('package-ecosystem: npm')
    expect(config).toContain('package-ecosystem: github-actions')
    expect([...config.matchAll(/interval: weekly/g)]).toHaveLength(2)
    expect(config).toContain('minor-and-patch')
    expect(config).toContain("dependency-name: '@types/node'")
    expect(config).toContain('version-update:semver-major')
  })
})
