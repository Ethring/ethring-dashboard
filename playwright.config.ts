import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({
    path: '.env.test',
    override: true,
});

const localFrontUrl = 'http://localhost:8080/';
const testFilesNameNoTx = 'dashboard|send|swap';
export const proxyUrl = process.env.CI ? 'http://mitmproxy:8080' : 'http://localhost:8082';

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
        baseURL: localFrontUrl,
        trace: process.env.CI ? 'on-first-retry' : 'on',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },

    webServer: [
        {
            command: 'npm run serve',
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
            testMatch: process.env.CI
                ? `**/tests/e2e/@(${testFilesNameNoTx}|mockTxSend).spec.ts`
                : `**/tests/e2e/@(${testFilesNameNoTx}).spec.ts`, //mocked tx test run only CI because proxy correct work only linux os
            teardown: 'delete mm',
        },
        {
            name: 'delete mm',
            testDir: './tests/__fixtures__/global',
            testMatch: 'global.teardown.ts',
        },
    ],
});
