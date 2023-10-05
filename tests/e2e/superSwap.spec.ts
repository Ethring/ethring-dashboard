import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { DashboardPage } from '../model/zometPages';
import { getServices, SERVICE_TYPE } from '../../src/config/services';
import { getNotifyMmPage } from '../model/metaMaskPages';
import { TEST_CONST, getTestVar } from '../envHelper';

const supportedServiceByBridge = getServices(SERVICE_TYPE.BRIDGE);
const supportedServiceBySwap = getServices(SERVICE_TYPE.SWAP);

test.describe('SuperSwap e2e tests', () => {
    test('Case#1: Super Swap tx from ETH to BSC wEth to USDC', async ({ browser, context, page: Page, superSwapPage }) => {
        const netTo = 'Binance Smart Chain';
        const amount = '0.01';
        const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

        await superSwapPage.setDataAndClickSwap(netTo, amount);

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMM.signTx();

        expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
    });

    test('Case#2: Verifying data reset when navigating to swap page', async ({ page: Page, superSwapPage }) => {
        const netTo = 'Arbitrum One';

        await superSwapPage.setNetworkTo(netTo);
        const tokenInSuperSwap = superSwapPage.getTokenTo();

        const swapPage = await superSwapPage.goToSwap();
        const currentTokenTo = await swapPage.getTokenTo();

        expect(tokenInSuperSwap).not.toBe(currentTokenTo);
    });

    test('Case#3: Checking polled services for bridge', async ({ page, dashboard }: { page: Page; dashboard: DashboardPage }) => {
        const amount = '1';
        const requestedService: string[] = [];

        await dashboard.page.route('**/estimateBridge', (route) => {
            const regex = /\/([^/]+)\/api/;
            const match = route.request().url().match(regex);
            if (match && match[1]) {
                requestedService.push(match[1]);
            }
            route.continue();
        });

        const superSwapPage = await dashboard.goToSuperSwap();
        await superSwapPage.setAmount(amount);

        expect(requestedService).toEqual(supportedServiceByBridge);
    });
});
