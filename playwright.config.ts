import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:48731/paste-scraper-builder/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run pages-preview -- --port 48731 --strictPort',
    url: 'http://127.0.0.1:48731/paste-scraper-builder/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
