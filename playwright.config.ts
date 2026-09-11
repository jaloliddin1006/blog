import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4323',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: 'studio.spec.ts' },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: 'studio.spec.ts' },
    // The gate in front of the studio; one run is enough, it has no viewport.
    { name: 'studio', testMatch: 'studio.spec.ts' },
  ],
  webServer: [
    {
      // A port of its own, so a running `npm run dev` is never picked up by mistake.
      command: 'npm run build && PORT=4323 node scripts/serve-dist.mjs',
      url: 'http://localhost:4323',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // The container's server, with a fixed TOTP secret the test can compute.
      command: 'node server/app.mjs',
      url: 'http://localhost:4324/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: '4324',
        STUDIO_PASSWORD: '123',
        STUDIO_TOTP_SECRET: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        STUDIO_SECRET_FILE: '/tmp/studio-test-secret.json',
      },
    },
  ],
});
