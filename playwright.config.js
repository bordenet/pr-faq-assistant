import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid race conditions with IndexedDB
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Single worker to avoid parallel state issues
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    // Don't persist storage between tests
    storageState: undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use fresh browser context for each test
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
  ],

  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});

