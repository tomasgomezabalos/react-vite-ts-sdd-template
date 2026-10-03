import { beforeEach, describe, expect, it, vi } from 'vitest'

const reactDom = vi.hoisted(() => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

vi.mock('react-dom/client', () => ({
  createRoot: reactDom.createRoot,
}))

describe('application entrypoint', () => {
  beforeEach(() => {
    vi.resetModules()
    reactDom.createRoot.mockClear()
    document.body.replaceChildren()
  })

  it('mounts the application in the root element', async () => {
    const rootElement = document.createElement('div')
    rootElement.id = 'root'
    document.body.append(rootElement)

    await import('../src/main')

    expect(reactDom.createRoot).toHaveBeenCalledOnce()
    expect(reactDom.createRoot).toHaveBeenCalledWith(rootElement)
    expect(
      reactDom.createRoot.mock.results[0]?.value.render,
    ).toHaveBeenCalledOnce()
  })

  it('fails explicitly when the root element is absent', async () => {
    await expect(import('../src/main')).rejects.toThrow(
      'Root element not found',
    )
    expect(reactDom.createRoot).not.toHaveBeenCalled()
  })
})
