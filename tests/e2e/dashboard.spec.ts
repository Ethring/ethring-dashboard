import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { getTestVar, TEST_CONST } from '../envHelper';
import { getNotifyMmPage } from '../model/metaMaskPages';
const sleep = require('util').promisify(setTimeout);

// test.describe('Dashboard page tests', () => {
//     test.only('Case#1: Auth by MM, net ETH', async ({ browser, context, page: Page, dashboardProtocol }) => {
//         await sleep(5000);
//         await dashboardProtocol.page.pause();
//         await dashboardProtocol.page.waitForSelector('div.ant-skeleton', { state: 'hidden', timeout: 20000 });
//         await expect(dashboardProtocol.page).toHaveScreenshot();
//     });
// });

test.describe('Auth page tests', () => {
    test('Case#1: Auth by MM, network did not support', async ({ browser, context, page: Page, authPage }) => {
        await sleep(5000);
        await authPage.page.waitForSelector('div.ant-skeleton', { state: 'hidden', timeout: 20000 });
        await expect(authPage.page).toHaveScreenshot();
    });

    test('Case#2: Auth by MM, network is support', async ({ browser, context, page: Page, authPage }) => {
        await sleep(5000);
        await authPage.page.waitForSelector('div.ant-skeleton', { state: 'hidden', timeout: 20000 });
        await expect(authPage.page).toHaveScreenshot();
    });

    test.only('Case#3: Auth by MM, empty wallet', async ({ browser, context, page: Page, authPageEmptyWallet }) => {
        await expect(authPageEmptyWallet.page).toHaveScreenshot();
    });
});
