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
      projects: [
        {
          extends: true,
          test: {
            name: 'app',
            include: ['tests/**/*.test.{ts,tsx}'],
            exclude: ['tests/tools/**'],
            environment: 'jsdom',
            setupFiles: ['./tests/setup/vitest.setup.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'tools',
            include: ['tests/tools/**/*.test.ts'],
            environment: 'node',
          },
        },
      ],
      clearMocks: true,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/**/types.ts', 'tests/**'],
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
