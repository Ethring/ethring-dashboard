import { testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { TEST_CONST, getTestVar } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { FIVE_SECONDS, ONE_SECOND, confirmConnectMmWallet } from '../__fixtures__/fixtureHelper';
import util from 'util';
const sleep = util.promisify(setTimeout);

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
        'Case#1: Super Swap tx from ETH to BSC wEth to USDC',
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

    testMetaMask.skip('Case#2: Verifying data reset when navigating to swap page', async ({ page, superSwapPageBalanceMock: superSwapPage }) => {
        const netTo = 'Arbitrum One';

        await superSwapPage.setNetworkTo(netTo);
        const tokenInSuperSwap = superSwapPage.getTokenTo();

        const swapPage = await superSwapPage.goToModule('swap');

        // const currentTokenTo = await swapPage.getTokenTo();

        // expect(tokenInSuperSwap).not.toBe(currentTokenTo);
    });

    testMetaMask.skip(
        'Case#5: Super Swap tx:swap net:Polygon from:Matic to:1inch Cancel wallet change',
        async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Polygon';
            const amount = '0.01';
            const tokenTo = '1INCH';
            const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

            await superSwapPage.setFromNetAndAmount(netTo, amount);
            await superSwapPage.setNetToAndTokenTo(netTo, tokenTo);
            await superSwapPage.openRouteInfo();

            await expect(superSwapPage.page).toHaveScreenshot();

            // await superSwapPage.clickSwitchNetwork();
            // const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            // await expect(superSwapPage.page).toHaveScreenshot();
            // await notifyMM.signTx();

            // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
        },
    );

    testMetaMask('Case#: SuperSwap estimate route without authorization', async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {
        const TO_NET = 'Polygon';
        const TO_TOKEN = 'MATIC'
        const AMOUNT = '2';

        // Disconnect from account
        await superSwapPage.disconnectFirstWallet();

        await superSwapPage.page.locator('div.wallet-adapter-container').hover();

        await sleep(FIVE_SECONDS);

        // Go to SuperSwap module without authorization
        await superSwapPage.goToModule('superSwap');

        await sleep(ONE_SECOND);

        await expect(superSwapPage.page).toHaveScreenshot();

        await superSwapPage.setNetToAndTokenTo(TO_NET, TO_TOKEN);

        await superSwapPage.setAmount(AMOUNT);

        // Estimate route without authorization
        await superSwapPage.openRouteInfo();

        await sleep(FIVE_SECONDS);

        await expect(superSwapPage.page).toHaveScreenshot({
            fullPage: true,
            mask: [
                superSwapPage.page.locator('div.swap-field-input-container > input[name="dstAmount"]'),
                superSwapPage.page.locator('div.balance-price'),
                superSwapPage.page.locator('div.amount-block.currency'),
                superSwapPage.page.locator('div.amount-block.usd')
            ],
        });

        await superSwapPage.clickConfirm();

        await superSwapPage.page.getByText('MetaMask').click();

        await superSwapPage.page.locator('div.wallet-adapter-container').hover();

        await expect(superSwapPage.page).toHaveScreenshot();
    });
});
