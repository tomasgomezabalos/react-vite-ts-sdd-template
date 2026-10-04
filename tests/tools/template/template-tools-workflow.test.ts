// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '../../..')

describe('template tools workflow', () => {
  it('runs the tools suite of the template with minimal, pinned automation', async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, '.github/workflows/template-tools.yml'),
      'utf8',
    )

    expect(workflow).toContain('name: Template tools')
    expect(workflow).toContain('push:')
    expect(workflow).toContain('- main')
    expect(workflow).toContain('pull_request:')
    expect(workflow).toContain('contents: read')
    expect(workflow).toContain('cancel-in-progress: true')
    expect(workflow).toContain('persist-credentials: false')
    expect(workflow).toContain('node-version-file: .nvmrc')
    expect(workflow).toContain('cache-dependency-path: package-lock.json')
    expect(workflow).not.toMatch(/secrets\.|npm publish|deploy/i)

    const commands = [...workflow.matchAll(/^\s+run:\s+(.+)$/gm)].map(
      (match) => match[1],
    )
    expect(commands).toEqual(['npm ci', 'npm run test:tools'])

    for (const [, action, comment] of workflow.matchAll(
      /^\s+uses:\s+(\S+)(.*)$/gm,
    )) {
      expect(action, action).toMatch(/@[0-9a-f]{40}$/)
      expect(comment, action).toMatch(/# v\d/)
    }
  })
})
