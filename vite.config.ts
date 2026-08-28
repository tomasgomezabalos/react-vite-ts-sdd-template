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
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}', 'tools/**/*.ts'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/types.ts',
          'tools/**/types.ts',
          'tests/**',
        ],
        thresholds: {
          statements: 70,
          branches: 55,
          functions: 75,
          lines: 75,
          perFile: false,
          autoUpdate: false,
        },
      },
    },
  }
})
