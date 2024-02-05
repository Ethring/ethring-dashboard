import { testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { TEST_CONST, getTestVar } from '../envHelper';
import { MetaMaskNotifyPage, getNotifyMmPage } from '../model/MetaMask/MetaMask.pages';

testMetaMask.describe('SuperSwap e2e tests', () => {
    testMetaMask('Case#1: Super Swap tx:swap net:Polygon from:Matic to:1inch', async ({ browser, context, page, superSwapPage }) => {
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const netTo = 'Polygon';
        const amount = '0.01';
        const tokenTo = '1INCH';
        const balancePolygonRoute = `**/srv-data-provider/api/balances?net=${netTo.toLowerCase()}&address=${addressFrom}**`;

        const mockPolygonBalanceData = {
            ok: true,
            data: {
                tokens: [
                    {
                        name: 'Polygon',
                        symbol: 'MATIC',
                        address: null,
                        decimals: 18,
                        logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png?1624446912',
                        price: '0.9177678554143069',
                        priceChange: '0.026321517298910857',
                        balanceUsd: '0.9177678554143069',
                        balance: '1.0',
                    },
                ],
                nfts: [],
                integrations: [],
            },
            error: '',
        };
        const mockDataEstimateParaswap = {
            ok: true,
            data: {
                fromTokenAmount: '0.01',
                toTokenAmount: '0.025662189345172519',
                fee: {
                    amount: '0.0133305026031496',
                    currency: 'MATIC',
                },
            },
            error: '',
        };
        const mockDataEstimate1inch = {
            ok: true,
            data: {
                fromTokenAmount: '0.01',
                toTokenAmount: '0.02531072860888516',
                fee: {
                    amount: '0.023659807583113285',
                    currency: 'MATIC',
                },
            },
            error: '',
        };
        const mockDataEstimateSynapse = {
            ok: false,
            data: null,
            error: {
                code: 'ROUTE_NOT_FOUND',
                message: 'Estimate route is not found for chosen pair',
            },
        };

        await superSwapPage.mockRoute(balancePolygonRoute, mockPolygonBalanceData);

        await superSwapPage.page.waitForResponse(balancePolygonRoute); // TODO сейчас есть баг https://paradigmcitadel.atlassian.net/browse/ZMT-866 после фикса удалить эту ожидалку

        await superSwapPage.setFromNetAmount(netTo, amount);
        await superSwapPage.setToNetToken(netTo, tokenTo);
        await superSwapPage.openRouteInfo();

        await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot();

        await superSwapPage.clickConfirm();
        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

        await expect(superSwapPage.getBaseContentElement()).toHaveScreenshot({ animations: 'disabled' });
        // await notifyMM.signTx();

        // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);

        // const marketCapMaticRoute = '**/marketcaps/coingecko?tickers=matic-network**';
        // const marketCap1inchRoute = '**/token-price/coingecko/polygon-pos?addresses=0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f&**';

        // zometPage.mockRoute(marketCapMaticRoute, marketCapMockData.polygon_matic);
        // zometPage.mockRoute(marketCap1inchRoute, marketCapMockData.polygon_1inch);
    });

    testMetaMask('Case#1: Super Swap tx from ETH to BSC wEth to USDC', async ({ browser, context, page, superSwapPage: superSwapPage }) => {
        const netTo = 'Binance Smart Chain';
        const amount = '0.01';
        const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

        await superSwapPage.setToNetToken(netTo, amount);

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

        await expect(superSwapPage.page).toHaveScreenshot();
        // await notifyMM.signTx();

        // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
    });

    testMetaMask('Case#2: Verifying data reset when navigating to swap page', async ({ page, superSwapPage }) => {
        const netTo = 'Arbitrum One';

        await superSwapPage.setNetworkTo(netTo);
        const tokenInSuperSwap = superSwapPage.getTokenTo();

        const swapPage = await superSwapPage.goToModule('swap');

        // const currentTokenTo = await swapPage.getTokenTo();

        // expect(tokenInSuperSwap).not.toBe(currentTokenTo);
    });

    testMetaMask(
        'Case#5: Super Swap tx:swap net:Polygon from:Matic to:1inch Отменить смену кошелька',
        async ({ browser, context, page, superSwapPage }) => {
            const netTo = 'Polygon';
            const amount = '0.01';
            const tokenTo = '1INCH';
            const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

            await superSwapPage.setFromNetAmount(netTo, amount);
            await superSwapPage.setToNetToken(netTo, tokenTo);
            await superSwapPage.openRouteInfo();

            await expect(superSwapPage.page).toHaveScreenshot();

            // await superSwapPage.clickSwitchNetwork();
            // const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            // await expect(superSwapPage.page).toHaveScreenshot();
            // await notifyMM.signTx();

            // expect(await superSwapPage.getLinkFromSuccessPanel()).toContain(txHash);
        }
    );
});
