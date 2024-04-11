import { testKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { test, expect } from '@playwright/test';
import util from 'util';
import { getTestVar, TEST_CONST } from '../envHelper';
import { emptyBalanceMockData, mockBalanceDataBySendTest } from '../data/mockHelper';
import { MetaMaskNotifyPage, getNotifyMmPage, getHomeMmPage } from '../model/MetaMask/MetaMask.pages';
import { KeplrNotifyPage, getNotifyKeplrPage } from '../model/Keplr/Keplr.pages';
import { COSMOS_WALLETS_BY_PROTOCOL_SEED, IGNORED_LOCATORS, MEMO_BY_KEPLR_TEST } from '../data/constants';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';
import {
    mockPostTransactionsRouteSendReject,
    mockPostTransactionsWsByCreateEventSendReject,
    mockPutTransactionsRouteSendReject,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject,
} from '../data/mockDataByTests/SendRejectTxMock';
import {
    mockPostTransactionsRouteSendRejectKeplr,
    mockPostTransactionsWsByCreateEventSendRejectKeplr,
    mockPutTransactionsRouteSendRejectKeplr,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendRejectKeplr,
} from '../data/mockDataByTests/SendRejectTxKeplrMock';

const sleep = util.promisify(setTimeout);

testMetaMask.describe('MetaMask Send e2e tests', () => {
    testMetaMask('Case#: Send page', async ({ browser, context, page, dashboardEmptyWallet }) => {
        const address = getTestVar(TEST_CONST.EMPTY_ETH_ADDRESS);
        await dashboardEmptyWallet.mockBalanceRequest('eth', emptyBalanceMockData, address);

        const sendPage = await dashboardEmptyWallet.goToModule('send');
        await sendPage.waitLoadImg();
        await expect(sendPage.page).toHaveScreenshot({
            mask: [sendPage.page.locator(IGNORED_LOCATORS.HEADER), sendPage.page.locator(IGNORED_LOCATORS.ASIDE)],
        });
    });

    testMetaMask(
        'Case#: Reject send native token to another address in Avalanche with change MM network',
        async ({ browser, context, page, sendPageCoingeckoMockRejectTest }) => {
            const network = 'Avalanche';
            const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
            const amount = '0.001';

            await sendPageCoingeckoMockRejectTest.changeNetwork(network);
            await sendPageCoingeckoMockRejectTest.setAddressTo(addressTo);
            await sendPageCoingeckoMockRejectTest.setAmount(amount);
            await sleep(FIVE_SECONDS); // wait able button "change network"

            await expect(sendPageCoingeckoMockRejectTest.page).toHaveScreenshot({
                mask: [
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.HEADER),
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.ASIDE),
                ],
            });

            await sendPageCoingeckoMockRejectTest.modifyDataByPostTxRequest(
                mockPostTransactionsRouteSendReject,
                mockPostTransactionsWsByCreateEventSendReject,
            );

            await sendPageCoingeckoMockRejectTest.modifyDataByGetTxRequest(
                mockPostTransactionsRouteSendReject,
            );

            await sendPageCoingeckoMockRejectTest.modifyDataByPutTxRequest(
                mockPutTransactionsRouteSendReject,
                mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject,
            );
            await sendPageCoingeckoMockRejectTest.clickConfirm();

            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await expect(sendPageCoingeckoMockRejectTest.page).toHaveScreenshot({
                maxDiffPixels: 110,
                mask: [
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.HEADER),
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.ASIDE),
                ],
            });
            await notifyMM.changeNetwork();

            const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            const recipientAddress = await notifyMMtx.getReceiverAddress();
            expect(recipientAddress).toBe(addressTo);

            const amountFromMM = await notifyMMtx.getAmount();
            expect(amountFromMM).toBe(amount);

            await expect(sendPageCoingeckoMockRejectTest.page).toHaveScreenshot({
                maxDiffPixels: 240,
                mask: [
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.HEADER),
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.ASIDE),
                ],
            });

            await notifyMMtx.rejectTx();
            await sendPageCoingeckoMockRejectTest.getBaseContentElement().hover();
            await expect(sendPageCoingeckoMockRejectTest.page).toHaveScreenshot({
                maxDiffPixels: 250,
                mask: [
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.HEADER),
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.ASIDE),
                    sendPageCoingeckoMockRejectTest.page.locator(IGNORED_LOCATORS.TRANSACTION_PROGRESS)
                ],
            });
            // TODO нужен тест на отправку НЕ нативного токена (например USDC)
            // TODO нужен тест когда отменяем переключение сети ММ (скрином проверять текст ошибки)
        },
    );

    // this test was actual when we use handler by change wallet in MM
    testMetaMask.skip('Case#: Checking the token change when changing the network via MM', async ({ browser, context, page, sendPage }) => {
        const network = 'Polygon';
        const networkNameInMm = 'Polygon Mainnet';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest[network.toLowerCase()], addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);

        const homeMmPage = await getHomeMmPage(context);
        await homeMmPage.addNetwork(networkNameInMm);
        await balancePromise;
        await sendPage.waitLoadImg();

        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
    });
});

testKeplr.describe('Keplr Send e2e tests', () => {
    testKeplr('Case#: Reject send native token in Cosmos', async ({ browser, context, page, sendPage }) => {
        const network = 'cosmoshub';
        const addressTo = COSMOS_WALLETS_BY_PROTOCOL_SEED[network];
        const amount = '0.001';
        const memo = MEMO_BY_KEPLR_TEST;

        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);
        await sendPage.setMemoCheckbox();
        await sendPage.setMemo(memo);

        await sendPage.modifyDataByPostTxRequest(
            mockPostTransactionsRouteSendRejectKeplr,
            mockPostTransactionsWsByCreateEventSendRejectKeplr,
        );

        await sendPage.modifyDataByGetTxRequest(
            mockPostTransactionsRouteSendRejectKeplr
        );

        await sendPage.modifyDataByPutTxRequest(
            mockPutTransactionsRouteSendRejectKeplr,
            mockPutTransactionsWsByUpdateTransactionEventInProgressSendRejectKeplr,
        );

        await sendPage.clickConfirm();

        const notifyKeplr = new KeplrNotifyPage(await getNotifyKeplrPage(context));
        const memoInKeplrNotify = await notifyKeplr.page.innerText('div.djtFnd');

        expect(memoInKeplrNotify).toBe(memo);
    });
});
