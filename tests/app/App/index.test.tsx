import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { App } from '../../../src/app/App'

describe('App', () => {
  it('renders the empty home page at the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
  })

  it('renders no route content for an unmatched URL', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
  })
})
