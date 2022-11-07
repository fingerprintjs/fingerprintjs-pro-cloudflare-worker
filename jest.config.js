/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'miniflare',
  testRegex: '/test/.+test.tsx?$',
  passWithNoTests: true,
  collectCoverageFrom: ['./src/utils/**.ts'],
  coverageReporters: ['lcov', 'json-summary', ['text', { file: 'coverage.txt', path: './' }]],
}
