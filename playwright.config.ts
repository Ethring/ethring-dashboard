import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
    path: '.env.test',
    override: true,
});

const localFrontUrl = 'http://localhost:8080/';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: localFrontUrl,
        trace: process.env.CI ? 'on-first-retry' : 'on',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },

    webServer: {
        command: 'npm run serve',
        url: localFrontUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
    },

    projects: [
        {
            name: 'setup',
            testMatch: '**/e2e/utils/global.setup.ts',
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testMatch: '**/tests/e2e/dashboard.spec.ts',
            teardown: 'delete mm',
        },
        {
            name: 'delete mm',
            testMatch: '**/e2e/utils/global.teardown.ts',
        },
    ],
    timeout: 2 * 60 * 1000,
});
