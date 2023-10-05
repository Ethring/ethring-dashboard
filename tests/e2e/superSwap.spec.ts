import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { DashboardPage } from '../model/zometPages';
import { getServices, SERVICE_TYPE } from '../../src/config/services';
import { getNotifyMmPage } from '../model/metaMaskPages';

const supportedServiceByBridge = getServices(SERVICE_TYPE.BRIDGE);
const supportedServiceBySwap = getServices(SERVICE_TYPE.SWAP);

test.describe('SuperSwap e2e tests', () => {
    test('Case#1: Super Swap tx from ETH to BSC wEth to USDC', async ({ browser, context, page: Page, superSwapPage }) => {
        await superSwapPage.setDataAndClickSwap('Binance Smart Chain', '0.01');

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await notifyMM.signTx();

        expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(
            '0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4'
        );
    });

    test('Case#2: Verifying data reset when navigating to swap page', async ({ page: Page, superSwapPage }) => {
        await superSwapPage.setNetworkTo('Arbitrum One');
        const tokenInSuperSwap = superSwapPage.getTokenTo();

        const swapPage = await superSwapPage.goToSwap();
        const currentTokenTo = await swapPage.getTokenTo();

        expect(tokenInSuperSwap).not.toBe(currentTokenTo);
    });

    test('Case#3: Verifying if all service response errors', async ({ page, dashboard }: { page; dashboard: DashboardPage }) => {
        await dashboard.page.route('**/getSupportedChains', (route) => {
            route.fulfill({
                status: 500,
                json: {
                    ok: false,
                    data: '',
                    error: 'Oops, sorry bro',
                },
            });
        });

        const superSwapPage = await dashboard.goToSuperSwap();
        await superSwapPage.setNetworkTo('Arbitrum One');
        // TODO тут определить поведение которое отображает дашборд при отсутствии данных о поддерживаемых чейнах
    });

    test('Case#4: Checking polled services for bridge', async ({ page, dashboard }: { page: Page; dashboard: DashboardPage }) => {
        let requestedService: string[] = [];

        await dashboard.page.route('**/estimateBridge', (route) => {
            const regex = /\/([^/]+)\/api/;
            requestedService.push(route.request().url().match(regex)[1]);
            route.continue();
        });

        const superSwapPage = await dashboard.goToSuperSwap();
        await superSwapPage.setAmount('1');

        expect(requestedService).toEqual(supportedServiceByBridge);
    });
});
