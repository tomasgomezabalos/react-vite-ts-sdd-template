import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteLoading } from '../../../src/app/RouteLoading'
import { expectNoAccessibilityViolations } from '../../setup/axe'

describe('RouteLoading', () => {
  it('announces that the page is loading in the active language', () => {
    render(<RouteLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading page...')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<RouteLoading />)

    await expectNoAccessibilityViolations(container)
  })
})
