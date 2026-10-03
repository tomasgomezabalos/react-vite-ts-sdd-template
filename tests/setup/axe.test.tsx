import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteLoading } from '../../src/app/RouteLoading'
import { expectNoAccessibilityViolations } from './axe'

describe('expectNoAccessibilityViolations', () => {
  it('resolves for accessible content', async () => {
    const { container } = render(<RouteLoading />)

    await expect(
      expectNoAccessibilityViolations(container),
    ).resolves.toBeUndefined()
  })

  it('rejects with the rule, impact and selector of each violation', async () => {
    const { container } = render(<img src="x.png" />)

    await expect(expectNoAccessibilityViolations(container)).rejects.toThrow(
      /image-alt \(critical\).*img/s,
    )
  })
})
