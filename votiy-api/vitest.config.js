import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/domain/**/*.js',
        'src/app.js',
        'src/api/**/*.js',
        'src/email/**/*.js',
        'src/observability/**/*.js',
      ],
      exclude: ['src/server.js'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
})
