import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

import * as ChromeLauncher from 'chrome-launcher';

import lighthouse from 'lighthouse';
import { ReportGenerator } from 'lighthouse/report/generator/report-generator';

// Set flags for Chrome Launcher
const flags = {
    chromeFlags: ['--headless', '--no-sandbox'],
};

async function runLighthouse(url) {
    // Launch Chrome with specified flags
    const chrome = await ChromeLauncher.launch(flags);

    const options = {
        port: chrome.port,
        formFactor: 'desktop',
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
        output: 'html',
        throttlingMethod: 'provided',
    };

    // Run Lighthouse audit on the provided URL with specified options
    const runnerResult = await lighthouse(url, options);

    // Close Chrome after the audit is complete
    await chrome.kill();

    // Define report html path
    const outputPath = path.join(process.env.CI_PROJECT_DIR, 'tests', 'performance', 'performance-report.html');

    // Generate html report
    fs.writeFileSync(outputPath, ReportGenerator.generateReportHtml(runnerResult.lhr));

    return runnerResult;
}

describe('Performance tests', async () => {
    test(
        'Case #1. Check performance metrics',
        async () => {
            const result = await runLighthouse(process.env.BRANCH_URL);

            const lhr = result.lhr;
            const audits = lhr.audits;
            const score = lhr.categories.performance.score * 100;

            console.log('\n-------------------------------------------------------------');
            console.log('Performance score: ', score);
            console.log('Cumulative Layout Shift metric: ', audits['cumulative-layout-shift']?.displayValue);
            console.log('Speed Index metric: ', audits['speed-index']?.displayValue);
            console.log('First Contentful Paint metric: ', audits['first-contentful-paint']?.displayValue);
            console.log('Total Blocking Time metric: ', audits['total-blocking-time']?.displayValue);
            console.log('Largest Contentful Paint metric: ', audits['largest-contentful-paint-element']?.displayValue);
            console.log('\n-------------------------------------------------------------');

            expect(score).toBeGreaterThan(Number(process.env.PERFORMANCE_MIN_SCORE));
            expect(audits['cumulative-layout-shift']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_CLS));
            expect(audits['speed-index']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_SI));
            expect(audits['first-contentful-paint']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_FSP));
            expect(audits['total-blocking-time']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_TBT));
            expect(Number(audits['largest-contentful-paint-element']?.displayValue?.replace(/[^0-9]/g, ''))).toBeLessThan(
                Number(process.env.PERFORMANCE_LCP),
            );
        },
        5 * 60 * 1000, // 5 min
    );
});
