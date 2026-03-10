/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'miniflare',
  testRegex: '/__tests__/.+test.ts$',
  passWithNoTests: true,
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageReporters: ['lcov', 'json-summary', ['text', { file: 'coverage.txt', path: './' }]],
}
