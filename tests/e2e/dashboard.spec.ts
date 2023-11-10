import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import mockData from '../data/mockHelper';

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
        await dashboardProtocol.mockBalanceRequest('eth', mockData.eth);
        await dashboardProtocol.mockBalanceRequest('arbitrum', mockData.arbitrum);
        await dashboardProtocol.mockBalanceRequest('optimism', mockData.optimism);
        await dashboardProtocol.mockBalanceRequest('bsc', mockData.bsc);
        await dashboardProtocol.mockBalanceRequest('polygon', mockData.polygon);
        await dashboardProtocol.mockBalanceRequest('fantom', mockData.fantom);
        await dashboardProtocol.mockBalanceRequest('avalanche', mockData.avalanche);

        await dashboardProtocol.page.getByTestId('tokens_group').scrollIntoViewIfNeeded();
        await expect(dashboardProtocol.page).toHaveScreenshot();

        for (const protocol of await dashboardProtocol.page.getByTestId('protocol_group').all()) {
            await protocol.scrollIntoViewIfNeeded();
            await expect(dashboardProtocol.page).toHaveScreenshot();
        }
    });
});
