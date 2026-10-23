import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  webServer: {
    command: 'npm run dev:backend',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
