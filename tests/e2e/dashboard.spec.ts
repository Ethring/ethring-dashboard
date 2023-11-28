import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { mockBalanceData } from '../data/mockHelper';
import { TEST_CONST, getTestVar } from '../envHelper';

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

    test('Case#2: Check ETH protocol view', async ({ browser, context, page: Page, dashboardProtocol }) => {
        const address = getTestVar(TEST_CONST.ETH_ADDRESS_BY_PROTOCOL_TEST);

        await dashboardProtocol.mockBalanceRequest('eth', mockBalanceData.eth, address);
        await dashboardProtocol.mockBalanceRequest('arbitrum', mockBalanceData.arbitrum, address);
        await dashboardProtocol.mockBalanceRequest('optimism', mockBalanceData.optimism, address);
        await dashboardProtocol.mockBalanceRequest('bsc', mockBalanceData.bsc, address);
        await dashboardProtocol.mockBalanceRequest('polygon', mockBalanceData.polygon, address);
        await dashboardProtocol.mockBalanceRequest('fantom', mockBalanceData.fantom, address);
        await dashboardProtocol.mockBalanceRequest('avalanche', mockBalanceData.avalanche, address);

        await dashboardProtocol.page.waitForSelector('div.ant-skeleton-active', { state: 'detached', timeout: 60000 });

        await expect(dashboardProtocol.page).toHaveScreenshot({ fullPage: true });
    });
});
