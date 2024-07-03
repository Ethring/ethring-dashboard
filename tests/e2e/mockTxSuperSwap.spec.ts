import { expect } from '@playwright/test';
import { testMetaMask } from '../__fixtures__/fixtures';
import { getTestVar, TEST_CONST } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';

testMetaMask.describe('SuperSwap e2e tests', () => {
    testMetaMask.skip(
        'Case#: Super Swap tx:swap net:Polygon tokenFrom:Matic tokenTo:1inch',
        async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Polygon';
            const amount = '0.01';
            const tokenTo = '1INCH';

            await superSwapPage.setFromNetAndAmount(netTo, amount);
            await superSwapPage.setNetToAndTokenTo(netTo, tokenTo);
            await superSwapPage.openRouteInfo();

            await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot();

            await superSwapPage.clickConfirm();
            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot();
            // await notifyMM.signTx();

            // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);

            // const marketCapMaticRoute = '**/marketcaps/coingecko?tickers=matic-network**';
            // const marketCap1inchRoute = '**/token-price/coingecko/polygon-pos?addresses=0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f&**';

            // zometPage.mockRoute(marketCapMaticRoute, marketCapMockData.polygon_matic);
            // zometPage.mockRoute(marketCap1inchRoute, marketCapMockData.polygon_1inch);
        },
    );

    testMetaMask.skip(
        'Case#: Super Swap tx from ETH to BSC wEth to USDC',
        async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Binance Smart Chain';
            const amount = '0.01';
            const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

            await superSwapPage.setNetToAndTokenTo(netTo, amount);

            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            await expect(superSwapPage.page).toHaveScreenshot();
            // await notifyMM.signTx();

            // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
        },
    );
});
