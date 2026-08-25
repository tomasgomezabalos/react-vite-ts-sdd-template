import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RouteLoading } from '../../../src/app/RouteLoading'

describe('RouteLoading', () => {
  it('announces that the page is loading in the active language', () => {
    render(<RouteLoading />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading page...')
  })
})
