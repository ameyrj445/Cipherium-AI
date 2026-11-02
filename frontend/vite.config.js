import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    pool: 'threads',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // Test fixtures are not product source; every product component, hook,
      // service, utility and entry point remains in the denominator.
      exclude: ['src/test/**'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { branches: 80 },
    },
  },
})
