import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['integration/**/*.integration.test.jsx'],
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost:5173/' } },
    setupFiles: ['./integration/setup.js'],
    fileParallelism: false,
    testTimeout: 45000,
    hookTimeout: 45000,
  },
});
