module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['plugin:@typescript-eslint/eslint-recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['@typescript-eslint', 'prettier'],
  ignorePatterns: ['build/*'],
  rules: {
    semi: ['error', 'never'],
    'linebreak-style': ['error', 'unix'],
    'prefer-const': 'error',
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error'],
    curly: [2, 'all'],
  },
}
