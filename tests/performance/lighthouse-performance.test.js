import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { describe, expect, test } from 'vitest';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { ReportGenerator } from 'lighthouse/report/generator/report-generator';

const axiosInstance = axios.create({ headers: { 'Cache-Control': 'no-cache', 'X-Apikey': process.env.REPORT_DB_API_KEY } });

const flags = {
    chromeFlags: ['--headless', '--no-sandbox'],
};

const runLighthouse = async (url) => {
    const chrome = await launch(flags);
    try {
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

        const runnerResult = await lighthouse(url, options);

        // Define report html path
        const outputPath = path.join(process.env.CI_PROJECT_DIR, 'tests', 'performance', 'performance-report.html');

        // Generate html report
        fs.writeFileSync(outputPath, ReportGenerator.generateReportHtml(runnerResult.lhr));

        return runnerResult;
    } finally {
        // Close Chrome after the audit is complete
        await chrome.kill();
    }
};

const saveReport = async (audits, score) => {
    console.log('\n-------------------------------------------------------------');
    console.log(`\nPerformance score: ${score}`);
    console.log(`Cumulative Layout Shift metric: ${audits['cumulative-layout-shift']?.displayValue}`);
    console.log(`Speed Index metric: ${audits['speed-index']?.displayValue}`);
    console.log(`First Contentful Paint metric: ${audits['first-contentful-paint']?.displayValue}`);
    console.log(`Total Blocking Time metric: ${audits['total-blocking-time']?.displayValue}`);
    console.log(`Largest Contentful Paint metric: ${audits['largest-contentful-paint-element']?.displayValue}`);
    console.log('\n-------------------------------------------------------------');

    try {
        await axiosInstance.post(process.env.REPORT_DB_URL, {
            branch: process.env.BRANCH_URL,
            performance_score: score.toString(),
            performance_cls: audits['cumulative-layout-shift']?.displayValue,
            performance_si: audits['speed-index']?.displayValue,
            performance_tbt: audits['total-blocking-time']?.displayValue,
            performance_lcp: audits['largest-contentful-paint-element']?.displayValue,
            performance_fcp: audits['first-contentful-paint']?.displayValue,
            date: new Date().toLocaleString(),
        });

        await generateReportList();
    } catch (e) {
        console.log(e);
    }
};

const generateReportList = async () => {
    const reportList = await axiosInstance.get(process.env.REPORT_DB_URL);

    const htmlContent = generateHtmlTable(reportList.data);

    const outputPath = path.join(process.env.CI_PROJECT_DIR, 'tests', 'performance', 'performance-report-list.html');
    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
};

const generateHtmlTable = (data) => {
    const keys = [
        '_id',
        'branch',
        'performance_score',
        'performance_cls',
        'performance_si',
        'performance_tbt',
        'performance_lcp',
        'performance_fcp',
        'date',
    ];

    const headers = keys.map((key) => `<th>${key === '_id' ? '№' : key}</th>`).join('');
    const rows = data.map((item, i) => `<tr>${keys.map((key, j) => `<td>${j === 0 ? i + 1 : item[key]}</td>`).join('')}</tr>`).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                th { background-color: #f2f2f2; text-transform: capitalize; }
                h1 { text-align: center; }
            </style>
        </head>
        <body>
            <h1>Performance Report</h1>
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </body>
        </html>
    `;
};

describe('Performance tests', () => {
    test(
        'Case #1. Check performance metrics',
        async () => {
            const result = await runLighthouse(process.env.BRANCH_URL);

            const { lhr } = result;
            const { audits, categories } = lhr;
            const score = categories.performance.score * 100;

            await saveReport(audits, score);

            expect(score).toBeGreaterThanOrEqual(Number(process.env.PERFORMANCE_MIN_SCORE));
            expect(audits['cumulative-layout-shift']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_CLS));
            expect(audits['speed-index']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_SI));
            expect(audits['first-contentful-paint']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_FSP));
            expect(audits['total-blocking-time']?.numericValue).toBeLessThan(Number(process.env.PERFORMANCE_TBT));
            expect(Number(audits['largest-contentful-paint-element']?.displayValue?.replace(/[^0-9]/g, ''))).toBeLessThan(
                Number(process.env.PERFORMANCE_LCP),
            );
        },
        5 * 60 * 1000, // 5 minutes timeout
    );
});
