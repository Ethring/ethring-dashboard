import { testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { emptyBalanceMockData, errorEstimateSwap, mockBalanceDataBySwapTest } from '../data/mockHelper';
import { INCORRECT_IMAGE_URL } from '../data/mockTokensListData';
import { TEST_CONST, getTestVar } from '../envHelper';
import { getHomeMmPage } from '../model/MetaMask/MetaMask.pages';
import { EVM_NETWORKS, IGNORED_LOCATORS } from '../data/constants';
import util from 'util';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';

const sleep = util.promisify(setTimeout);

const SWAP_SERVICE = 'srv-paraswap';

testMetaMask.describe('Swap e2e tests', () => {
    testMetaMask('Case#: Swap page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const swapPage = await dashboardEmptyWallet.goToModule('swap');
        await swapPage.waitDetachedSkeleton();
        await swapPage.waitLoadImg();

        await expect(swapPage.page).toHaveScreenshot({
            mask: [swapPage.page.locator(IGNORED_LOCATORS.HEADER), swapPage.page.locator(IGNORED_LOCATORS.ASIDE)],
        });
    });

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

            // open select modal
            await expect(swapPage.getSelectModalContent()).toHaveScreenshot();

            await swapPage.setTokenInTokensList(TOKEN_FROM);
            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();

            const imagePromiseTokenTo = swapPage.page.waitForResponse(INCORRECT_IMAGE_URL);
            await swapPage.openTokenPageTo();
            await imagePromiseTokenTo; // wait load last token image
            // open select modal
            await expect(swapPage.getSelectModalContent()).toHaveScreenshot();

            await swapPage.setTokenInTokensList(TOKEN_TO);
            await sleep(1000); // TODO need wait close tokens page
            await swapPage.waitLoadImg();

            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();
        },
    );

    testMetaMask('Case#: Swap by not found pair', async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
        const NET = 'Arbitrum';
        const TOKEN_FROM = 'ARB';
        const TOKEN_TO = '1INCH';
        const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;
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

        await expect(swapPage.getBaseContentElement()).toHaveScreenshot({
            mask: [swapPage.page.locator(IGNORED_LOCATORS.SERVICE_ICON)],
        });
    });

    testMetaMask('Case#: Swap if amount too big', async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
        const NET = 'Arbitrum';
        const TOKEN_FROM = 'ARB';
        const TOKEN_TO = '1INCH';
        const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET.toLowerCase()}**`;
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

        await expect(swapPage.getBaseContentElement()).toHaveScreenshot({ mask: [swapPage.page.locator('div.service-icon')] });
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
                EMPTY_BALANCE_NETS_MOCK.map((network) => swapPage.mockBalanceRequest(network, emptyBalanceMockData, ADDRESS)),
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
        },
    );

    testMetaMask(
        'Case#: Checking dollar equivalent and hover by select tokens',
        async ({ browser, context, page, swapPageMockTokensList: swapPage }) => {
            // description:
            // checking the display of values and dollar equivalents for the swap
            // check the selection of the selected token in the list of tokens

            const NET = 'eth';
            const TOKEN_FROM = 'ORAI';
            const TOKEN_TO = 'LON';
            // const WAITED_BALANCE_URL = `**/srv-data-provider/api/balances?net=${NET}**`;
            const AMOUNT = '1';

            const estimateMockData = {
                ok: true,
                data: {
                    fromTokenAmount: '1.0',
                    toTokenAmount: '9.302190440797261907',
                    fee: {
                        amount: '0.00375186407532274',
                        currency: 'ETH',
                    },
                },
                error: '',
            };
            // await swapPage.page.waitForResponse(WAITED_BALANCE_URL); // wait response wallet balance

            await swapPage.mockEstimateSwapRequest(SWAP_SERVICE, errorEstimateSwap, 500);
            await swapPage.setAmount(AMOUNT);
            await sleep(1000);

            await swapPage.openTokenPageFrom();
            await swapPage.mockEstimateSwapRequest(SWAP_SERVICE, errorEstimateSwap, 500);
            await swapPage.setTokenInTokensList(TOKEN_FROM);
            await swapPage.openTokenPageTo();

            const estimatePromise = swapPage.page.waitForResponse(`**/estimateSwap**`);
            await swapPage.mockEstimateSwapRequest(SWAP_SERVICE, estimateMockData, 200);
            await swapPage.setTokenInTokensList(TOKEN_TO);
            await estimatePromise;

            await sleep(FIVE_SECONDS);
            await expect(swapPage.getBaseContentElement()).toHaveScreenshot();

            await swapPage.openTokenPageTo();
            await expect(swapPage.getSelectModalContent()).toHaveScreenshot();
        },
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
