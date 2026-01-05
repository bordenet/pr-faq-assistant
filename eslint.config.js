/**
 * ESLint Configuration for PR-FAQ Assistant
 * Using flat config format (ESLint 9.x)
 */

export default [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                indexedDB: 'readonly',
                crypto: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                FormData: 'readonly',
                setTimeout: 'readonly',
                console: 'readonly',
                fetch: 'readonly'
            }
        },
        rules: {
            // Error prevention
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-console': 'off',
            
            // Code style
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'indent': ['error', 4],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            
            // Best practices
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'coverage/**',
            'tests/**'
        ]
    }
];

