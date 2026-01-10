/**
 * Vitest Configuration for PR-FAQ Assistant
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['tests/**/*.test.js'],
        exclude: [
            'node_modules/**',
            'genesis/**',
            'tests/e2e/**'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['js/**/*.js'],
            exclude: [
                'node_modules/',
                'tests/',
                'genesis/',
                '*.config.js',
                'js/app.js' // UI code - tested via E2E
            ],
            thresholds: {
                statements: 20,
                branches: 20,
                functions: 20,
                lines: 20
            }
        }
    }
});

