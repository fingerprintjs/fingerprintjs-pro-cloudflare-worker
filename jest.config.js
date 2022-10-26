/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/test/.+test.tsx?$',
  passWithNoTests: true,
  setupFiles: ['./jest.setup.js'],
  coverageReporters: ['lcov', 'json-summary'],
}
