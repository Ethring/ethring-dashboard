import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

declare global {
    interface ImportMeta {
        env: {
            CI: string | undefined;
        };
    }
}

dotenv.config({
    path: '.env.test',
    override: true,
});

const localFrontUrl = 'http://localhost:8080/';
const testFilesNameNoTx = 'dashboard|send|swap';
export const proxyUrl = import.meta.env.CI ? 'http://mitmproxy:8080' : 'http://localhost:8082';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: import.meta.env.CI ? true : false,
    forbidOnly: !!import.meta.env.CI,
    retries: import.meta.env.CI ? 2 : 0,
    workers: import.meta.env.CI ? 3 : 1,
    maxFailures: import.meta.env.CI ? 5 : undefined,
    reporter: 'html',
    timeout: 2 * 60 * 1000,
    use: {
        baseURL: localFrontUrl,
        trace: import.meta.env.CI ? 'on-first-retry' : 'on',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },

    webServer: [
        {
            command: 'npm run serve',
            url: localFrontUrl,
            reuseExistingServer: !import.meta.env.CI,
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
            testMatch: import.meta.env.CI
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
