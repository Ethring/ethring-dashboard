import { testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { TEST_CONST, getTestVar } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';
import util from 'util';
import { estimateMockDataByUnAuthUser } from '../data/mockHelper';
const sleep = util.promisify(setTimeout);

testMetaMask.describe('SuperSwap e2e tests', () => {
    testMetaMask.skip(
        'Case#: Verifying data reset when navigating to swap page',
        async ({ page, superSwapPageBalanceMock: superSwapPage }) => {
            const netTo = 'Arbitrum';

            await superSwapPage.setNetworkTo(netTo); // set default token to use network

            const swapPage = await superSwapPage.goToModule('swap');

            const currentTokenTo = await swapPage.page
                .locator(`//*[@data-qa="select-token"]/div[contains(@class, 'token-symbol')]`)
                .nth(1)
                .textContent();

            expect(currentTokenTo).toBe('Select'); // default text if token not set
        },
    );

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

    testMetaMask(
        'Case#: SuperSwap estimate route without authorization', // TODO add route to bridge transaction!
        async ({ browser, context, page, unauthSuperSwapPage: superSwapPage }) => {
            await superSwapPage.waitDetachedLoader();
            const regexEstimation = /\/getQuote/;

            await superSwapPage.goToModule('superSwap');

            const TO_NET = 'BNB Smart Chain';
            const FROM_NET = TO_NET;
            const TO_TOKEN = 'USDT';
            const AMOUNT = '2';

            await sleep(FIVE_SECONDS);

            await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot({
                mask: [superSwapPage.page.locator('div.token-icon'), superSwapPage.page.locator('div.reload-btn')],
            });

            // Mocking price for token
            const COINGECKO_ROUTE = '**/token-price/coingecko/**';

            const priceUsdt = {
                ok: true,
                data: {
                    '0x55d398326f99059ff775485246999027b3197955': {
                        usd: 1,
                        btc: 0.00001574,
                    },
                },
            };

            context.route(COINGECKO_ROUTE, (route) => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json; charset=utf-8',
                    body: JSON.stringify(priceUsdt),
                });
            });

            await superSwapPage.openNetworkFromListAndClickNet(FROM_NET);
            await superSwapPage.setNetToAndTokenTo(TO_NET, TO_TOKEN);

            superSwapPage.page.on('request', (data) => {
                if (!regexEstimation.test(data.url())) return;

                const param = data.postData();

                expect(JSON.parse(param)).toEqual({
                    fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                    toToken: '0x55d398326f99059ff775485246999027b3197955',
                    amount: '2',
                    ownerAddresses: {},
                    fromNet: 'bsc',
                    toNet: 'bsc',
                });
            });
            await superSwapPage.mockEstimateBridgeRequest(estimateMockDataByUnAuthUser, 200);

            await superSwapPage.setAmount(AMOUNT);

            // Estimate route without authorization
            await superSwapPage.openRouteInfo();

            await superSwapPage.waitDetachedSkeleton();

            await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot({
                mask: [superSwapPage.page.locator('div.token-icon'), superSwapPage.page.locator('div.reload-btn')],
            });
        },
    );

    // TODO 'Correct test case is next: sign one tx by service debridge (as example), then set data to tx use any other service. Check params in request "getAllowance"' testMetaMask('Case#: Check request params', async ({ browser, context, page, superSwapPageBalanceMock: superSwapPage }) => {    });
});
