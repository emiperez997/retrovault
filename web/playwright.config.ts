import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const webDir = __dirname;
const rootDir = resolve(__dirname, '..');
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4300', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: process.env['PLAYWRIGHT_CHANNEL'] || 'msedge' },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        channel: process.env['PLAYWRIGHT_CHANNEL'] || 'msedge',
      },
    },
  ],
  webServer: [
    {
      command:
        'postman simulation run postman/simulations/frontend.sim.yaml --port 4900 --output ndjson --no-history > postman/frontend.ndjson',
      cwd: rootDir,
      url: 'http://127.0.0.1:4900/retrovault/api/games',
      reuseExistingServer: false,
      timeout: 90000,
    },
    {
      command: 'npx ng serve --host 127.0.0.1 --port 4300 --proxy-config proxy.conf.cjs',
      cwd: webDir,
      url: 'http://127.0.0.1:4300',
      env: { RETROVAULT_API_URL: 'http://127.0.0.1:4900/retrovault', NG_CLI_ANALYTICS: 'false' },
      reuseExistingServer: false,
      timeout: 90000,
    },
  ],
});
