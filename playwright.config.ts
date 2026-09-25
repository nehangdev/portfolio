import { defineConfig, devices } from '@playwright/test';

// Runs against the static build, the same files that get deployed. Build first: `npm run build`.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  use: { baseURL: 'http://localhost:4300' },
  webServer: {
    command: 'npm run serve:dist',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
