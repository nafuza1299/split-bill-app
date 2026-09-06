import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Vitest's default pattern matches *.spec.ts too, which would pull the
    // Playwright suite in here — those only run under `npm run test:e2e`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // main.test.tsx imports main.tsx, which pulls index.css through the
    // Tailwind plugin; that first transform blows the 5s default on a cold run.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/components/catalyst/**', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
      thresholds: {
        perFile: true,
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
