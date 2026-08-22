import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Home } from '../../../src/pages/Home'

describe('Home', () => {
  it('renders an empty main content area', () => {
    render(<Home />)

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
  })
})
