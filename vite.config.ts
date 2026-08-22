import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const mockEntryPlugin = {
  name: 'mock-entry',
  transformIndexHtml: (html: string) =>
    html.replace('/src/main.tsx', '/mocks/main.ts'),
}

export default defineConfig(({ mode }) => {
  const isMockMode = mode === 'mock'

  return {
    publicDir: isMockMode ? 'mocks/public' : 'public',
    plugins: [react(), isMockMode && mockEntryPlugin],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup/vitest.setup.ts'],
      clearMocks: true,
      restoreMocks: true,
    },
  }
})
