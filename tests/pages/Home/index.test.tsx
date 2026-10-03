import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Home } from '../../../src/pages/Home'
import { expectNoAccessibilityViolations } from '../../setup/axe'

describe('Home', () => {
  it('renders an empty main content area', () => {
    render(<Home />)

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Home />)

    await expectNoAccessibilityViolations(container)
  })
})
