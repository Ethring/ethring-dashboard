import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';

test.describe('Auth page tests', () => {
    test('Case#1: Go to auth page', async ({ browser, context, page: Page, authPageEmptyWallet }) => {
        await expect(authPageEmptyWallet.page).toHaveScreenshot();
    });
});

test.describe('Dashboard page tests', () => {
    test('Case#1: Auth by MM, empty wallet', async ({ browser, context, page: Page, dashboardEmptyWallet }) => {
        await dashboardEmptyWallet.page.waitForSelector('div.ant-skeleton-active', { state: 'detached', timeout: 60000 });
        await expect(dashboardEmptyWallet.page).toHaveScreenshot();

        const sendPage = await dashboardEmptyWallet.goToSend();
        await expect(sendPage.page).toHaveScreenshot();

        const swapPage = await sendPage.goToSwap();
        await expect(swapPage.page).toHaveScreenshot();

        const bridgePage = await swapPage.goToBridge();
        await expect(bridgePage.page).toHaveScreenshot();

        const superSwapPage = await swapPage.goToSuperSwap();
        await expect(superSwapPage.page).toHaveScreenshot();
    });
});
