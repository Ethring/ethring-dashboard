import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
    path: '.env.test',
    override: true,
});

const localFrontUrl = 'http://localhost:5173';

const testFilesName = 'dashboard|send|swap|superSwap|mockTxSend|shortcut';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: process.env.CI ? true : false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 3 : 1,
    maxFailures: process.env.CI ? 5 : undefined,
    reporter: 'html',
    timeout: 2 * 60 * 1000,
    use: {
        ignoreHTTPSErrors: true,
        bypassCSP: true,

        baseURL: localFrontUrl,
        trace: process.env.CI ? 'on-first-retry' : 'on',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },

    webServer: [
        {
            command: 'npm run dev',
            url: localFrontUrl,
            reuseExistingServer: !process.env.CI,
            timeout: 180 * 1000,
        },
    ],

    projects: [
        {
            name: 'setup',
            testDir: './tests/__fixtures__/global',
            testMatch: 'global.setup.ts',
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testMatch: `**/tests/e2e/@(${testFilesName}).spec.ts`,
            teardown: 'delete extensions',
        },
        {
            name: 'delete extensions',
            testDir: './tests/__fixtures__/global',
            testMatch: 'global.teardown.ts',
        },
    ],
});
