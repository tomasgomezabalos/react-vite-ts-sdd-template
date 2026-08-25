import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../../src/app/App'

const homeModule = vi.hoisted(() => {
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolvePending) => {
    release = resolvePending
  })

  return { pending, resolve: () => release?.() }
})

vi.mock('../../../src/pages/Home', async () => {
  await homeModule.pending
  return vi.importActual('../../../src/pages/Home')
})

describe('App', () => {
  it('renders the route fallback before the empty home page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading page...')

    homeModule.resolve()

    await waitForElementToBeRemoved(() => screen.getByRole('status'))

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders no route content for an unmatched URL', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
