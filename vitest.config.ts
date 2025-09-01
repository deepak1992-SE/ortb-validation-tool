import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/models': resolve(__dirname, './src/models'),
      '@/services': resolve(__dirname, './src/services'),
      '@/validation': resolve(__dirname, './src/validation'),
      '@/ui': resolve(__dirname, './src/ui')
    }
  }
});