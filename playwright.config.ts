import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        proxy: {
            server: 'localhost:1080',
        },
        trace: 'on-first-retry',
        testIdAttribute: 'data-qa',
    },

    webServer: {
        command: 'npm run test:mockRpc',
        port: 1080,
        timeout: 40 * 1000,
        reuseExistingServer: !process.env.CI,
    },

    projects: [
        {
            name: 'setup',
            testMatch: '**/e2e/global.setup.ts',
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testMatch: '**/exampleci.spec.ts',
            teardown: 'delete mm',
        },
        {
            name: 'delete mm',
            testMatch: '**/e2e/global.teardown.ts',
        },
    ],
    timeout: 2 * 60 * 1000,
});
