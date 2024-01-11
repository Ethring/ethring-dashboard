import { testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { emptyBalanceMockData, errorEstimateSwap, mockBalanceDataBySwapTest } from '../data/mockHelper';
import { INCORRECT_IMAGE_URL } from '../data/mockTokensListData';
import { TEST_CONST, getTestVar } from '../envHelper';
import { getHomeMmPage } from '../model/MetaMask/MetaMask.pages';
import { EVM_NETWORKS } from '../data/constants';

const sleep = require('util').promisify(setTimeout);

const supportedNetsBySwap = ['Ethereum', 'Binance Smart Chain', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Fantom']; // TODO до сих пор не работает. Нет фантома
const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

testMetaMask.describe('Swap e2e tests', () => {
    // it('Case#: Swap tx', async ({ browser, context, page: Page, swapPage }) => {
    //     const amount = '0.0001';

    //     await swapPage.swapTokens(amount);

    //     const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    //     await notifyMM.signTx();

    //     expect(await swapPage.getLinkFromSuccessPanel()).toContain(txHash);
    // });

    testMetaMask(
        'Case#: Checking token list change after network change',
        async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
            const NET = 'Avalanche';
            const TOKEN_FROM = 'USDC';
            const TOKEN_TO = 'GRT.e';
            const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
            const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;

            await swapPage.mockBalanceRequest(NET.toLowerCase(), mockBalanceDataBySwapTest[NET.toLowerCase()], ADDRESS);
            const avalancheBalancePromise = swapPage.page.waitForResponse(WAITED_BALANCE_URL);

            await swapPage.changeNetwork(NET);
            expect(await swapPage.getCurrentNet()).toContain(NET);

            await avalancheBalancePromise;

            const imagePromiseTokenFrom = swapPage.page.waitForResponse('https://assets.coingecko.com/coins/images/6319/large/usdc.png**');
            await swapPage.openTokenPageFrom();
            await imagePromiseTokenFrom; // wait load last token image
            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();

            await swapPage.setTokenInTokensList(TOKEN_FROM);
            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();

            const imagePromiseTokenTo = swapPage.page.waitForResponse(INCORRECT_IMAGE_URL);
            await swapPage.openTokenPageTo();
            await imagePromiseTokenTo; // wait load last token image
            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();

            await swapPage.setTokenInTokensList(TOKEN_TO);
            await sleep(1000); // TODO need wait close tokens page
            await swapPage.waitLoadImg();

            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();
        }
    );

    testMetaMask('Case#: Swap by not found pair', async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
        const NET = 'Arbitrum';
        const TOKEN_FROM = 'ARB';
        const TOKEN_TO = '1INCH';
        const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;
        const SWAP_SERVICE = 'srv-paraswap';
        const AMOUNT = '2';

        await swapPage.mockBalanceRequest(NET.toLowerCase(), mockBalanceDataBySwapTest[NET.toLowerCase()], ADDRESS);
        const balancePromise = swapPage.page.waitForResponse(WAITED_BALANCE_URL);

        await swapPage.changeNetwork(NET);

        await swapPage.openTokenPageFrom();
        await swapPage.setTokenInTokensList(TOKEN_FROM);

        await swapPage.openTokenPageTo();
        await swapPage.setTokenInTokensList(TOKEN_TO);

        await swapPage.mockEstimateSwapRequest(SWAP_SERVICE, errorEstimateSwap, 400);

        const estimatePromise = swapPage.page.waitForResponse(`**/estimateSwap**`);
        await swapPage.setAmount(AMOUNT);

        await Promise.all([balancePromise, estimatePromise]);
        await swapPage.waitDetachedSkeleton();
        await swapPage.waitLoadImg();

        await expect(swapPage.getBaseContentElement()).toHaveScreenshot();
    });

    testMetaMask('Case#: Swap if amount too big', async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
        const NET = 'Arbitrum';
        const TOKEN_FROM = 'ARB';
        const TOKEN_TO = '1INCH';
        const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;
        const SWAP_SERVICE = 'srv-paraswap';
        const AMOUNT = '55';

        await swapPage.mockBalanceRequest(NET.toLowerCase(), mockBalanceDataBySwapTest[NET.toLowerCase()], ADDRESS);
        const balancePromise = swapPage.page.waitForResponse(WAITED_BALANCE_URL);

        await swapPage.changeNetwork(NET);

        await swapPage.openTokenPageFrom();
        await swapPage.setTokenInTokensList(TOKEN_FROM);

        await swapPage.openTokenPageTo();
        await swapPage.setTokenInTokensList(TOKEN_TO);

        await swapPage.mockEstimateSwapRequest(SWAP_SERVICE, errorEstimateSwap, 400);

        const estimatePromise = swapPage.page.waitForResponse(`**/estimateSwap**`);
        await swapPage.setAmount(AMOUNT);

        await Promise.all([balancePromise, estimatePromise]);
        await swapPage.waitDetachedSkeleton();
        await swapPage.waitLoadImg();

        await expect(swapPage.getBaseContentElement()).toHaveScreenshot();
    });

    testMetaMask(
        'Case#: Check tokens and net in network change in MM',
        async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
            const NET = 'Arbitrum';
            const NET_ETH = 'eth';
            const NET_BY_MM = 'Arbitrum One';
            const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
            const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;

            const INDEX_ARBITRUM = EVM_NETWORKS.indexOf(NET.toLowerCase());
            const INDEX_ETH = EVM_NETWORKS.indexOf(NET_ETH.toLowerCase());

            let EMPTY_BALANCE_NETS_MOCK = [...EVM_NETWORKS];
            EMPTY_BALANCE_NETS_MOCK.splice(INDEX_ARBITRUM, 1);
            EMPTY_BALANCE_NETS_MOCK.splice(INDEX_ETH, 1);

            await swapPage.page.route('**/*', (route) => {
                return route.request().resourceType() === 'image' ? route.abort() : route.continue();
            });

            await Promise.all(
                EMPTY_BALANCE_NETS_MOCK.map((network) => swapPage.mockBalanceRequest(network, emptyBalanceMockData, ADDRESS))
            );

            await swapPage.mockBalanceRequest(NET.toLowerCase(), mockBalanceDataBySwapTest[NET.toLowerCase()], ADDRESS);
            await swapPage.mockBalanceRequest(NET_ETH.toLowerCase(), mockBalanceDataBySwapTest[NET_ETH.toLowerCase()], ADDRESS);

            const balancePromise = swapPage.page.waitForResponse(WAITED_BALANCE_URL);

            const mmHomePage = await getHomeMmPage(context);
            await mmHomePage.addNetwork(NET_BY_MM);

            await balancePromise;
            await swapPage.waitHiddenSkeleton();
            await swapPage.waitLoadImg();

            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();
        }
    );

    // test('Case#: Swap in Polygon: Matic to USDC', async ({ browser, context, page, swapPage }) => {
    //     const testedNet = 'Polygon';
    //     const tokenFrom = 'MATIC';

    //     await swapPage.changeNetworkBySwap(testedNet);

    //     const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    //     await notifyMM.addAndAcceptChangeNetwork();

    //     expect(await swapPage.getCurrentNetInSwap()).toContain(testedNet);
    //     await swapPage.setTokenFromInSwap(tokenFrom);

    //     await swapPage.swapTokens('0.1');
    //     const notifyMM2 = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    //     await notifyMM2.signTx();

    //     expect(await swapPage.getLinkFromSuccessPanel()).toContain(txHash);
    // });
});
