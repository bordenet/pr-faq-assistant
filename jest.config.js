export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js'],
  testMatch: [
    '**/assistant/tests/**/*.test.js',
    '**/validator/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/docs/'],
  collectCoverageFrom: [
    'assistant/js/**/*.js',
    'validator/js/**/*.js',
    '!**/tests/**',
    '!**/app.js',
    '!**/router.js',
    '!**/views.js',
    '!**/project-view.js',
    '!**/lib/**',
    '!**/core/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
