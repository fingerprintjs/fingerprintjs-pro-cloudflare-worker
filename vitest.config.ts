import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: [['text', { file: 'coverage.txt' }], ['json'], ['json-summary'], ['lcov']],
      include: ['src/**/*'],
    },
    projects: [
      {
        define: {
          __current_worker_version__: JSON.stringify('0.0.1-test.0'),
        },
        test: {
          environment: 'node',
          include: ['__tests__/**/*.test.ts'],
        },
      },
    ],
  },
})
