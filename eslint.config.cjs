const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.next/**',
      'coverage/**',
      '.netlify/**',
      'test/netlify-*.js',
    ],
  },
  js.configs.recommended,
  // ES Module test files
  {
    files: ['test/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        console: 'readonly',
        process: 'readonly',
        document: 'readonly',
        Buffer: 'readonly',
        crypto: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'warn',
    },
  },
  // ES Module scripts
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  // ES Module test files
  {
    files: ['**/*.js', '!test/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off', // TypeScript handles this better
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn', // Changed to warn
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // Disable for components with React globals
    },
  },
  // React components
  {
    files: ['components/**/*.tsx'],
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
