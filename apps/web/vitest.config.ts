import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '.vitest-cache',
  plugins: [react()],
  test: {
    clearMocks: true,
    environment: 'jsdom',
    fileParallelism: false,
    globals: true,
    maxWorkers: 1,
    minWorkers: 1,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    unstubGlobals: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
