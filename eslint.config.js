import globals from 'globals';
import js from '@eslint/js';

export default [
  // Recommended rules
  js.configs.recommended,

  // Global settings for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        process: 'readonly',
        marked: 'readonly', // Loaded via CDN for markdown rendering
      },
    },
    rules: {
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Test files configuration
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'docs/**',
      'dist/**',
      '*.min.js',
    ],
  },
];
