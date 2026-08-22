import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { i18n } from '../../src/i18n/config'
import { defaultLanguage } from '../../src/i18n/resources'
import { server } from '../../mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(async () => {
  cleanup()
  server.resetHandlers()
  await i18n.changeLanguage(defaultLanguage)
})

afterAll(() => server.close())
