import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
});
