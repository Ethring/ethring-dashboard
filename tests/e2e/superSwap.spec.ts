import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';

test.describe('SuperSwap e2e tests', () => {
    test('Case#1: Super Swap tx from ETH to BSC wEth to USDC', async ({ browser, context, page: Page, superSwapPage }) => {
        await superSwapPage.setDataAndClickSwap('Binance Smart Chain', '0.05');

        const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
        await notyfMM.signTx();

        expect(await superSwapPage.getLinkFromSuccessPanell()).toContain(
            '0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4'
        );
    });

    test('Case#2: Verifying data reset when navigating to swap page', async ({ page: Page, superSwapPage }) => {
        await superSwapPage.setNetworkToWithSleep('Arbitrum One');
        const tokenInSuperSwap = superSwapPage.getTokenTo();

        const swapPage = await superSwapPage.goToSwap();
        await swapPage.page.waitForLoadState();
        const currentTokenTo = await swapPage.getTokenTo();

        expect(tokenInSuperSwap).not.toBe(currentTokenTo);
    });
});
