import { testKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { test, expect } from '@playwright/test';
import util from 'util';
import { getTestVar, TEST_CONST } from '../envHelper';
import {
    emptyBalanceMockData,
    mockBalanceCosmosWallet,
    mockBalanceDataBySendTest,
    mockPostTransactionsRouteSendReject,
    mockPostTransactionsWsByCreateEventSendMockTx,
    mockPostTransactionsWsByCreateEventSendReject,
    mockPutTransactionsRouteSendReject,
    mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject,
} from '../data/mockHelper';
import { MetaMaskNotifyPage, getNotifyMmPage, getHomeMmPage } from '../model/MetaMask/MetaMask.pages';
import { KeplrNotifyPage, getNotifyKeplrPage } from '../model/Keplr/Keplr.pages';

import { EVM_NETWORKS, COSMOS_NETWORKS } from '../data/constants';
import { FIVE_SECONDS } from '../__fixtures__/fixtureHelper';

const sleep = util.promisify(setTimeout);

test.describe('MetaMask Send e2e tests', () => {
    testMetaMask.skip(
        'Case#: Reject send native token to another address in Avalanche with change MM network',
        async ({ browser, context, page, sendPageCoingeckoMock }) => {
            const network = 'Avalanche';
            const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
            const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
            const amount = '0.001';

            const INDEX_AVALANCHE = EVM_NETWORKS.indexOf(network.toLowerCase());
            let EMPTY_BALANCE_NETS_MOCK = [...EVM_NETWORKS];
            EMPTY_BALANCE_NETS_MOCK.splice(INDEX_AVALANCHE, 1);
            const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;

            await sendPageCoingeckoMock.mockBalanceRequest(
                network.toLowerCase(),
                mockBalanceDataBySendTest[network.toLowerCase()],
                addressFrom,
            );
            await Promise.all(
                EMPTY_BALANCE_NETS_MOCK.map((network) =>
                    sendPageCoingeckoMock.mockBalanceRequest(network, emptyBalanceMockData, addressFrom),
                ),
            );
            const balancePromise = sendPageCoingeckoMock.page.waitForResponse(WAITED_URL);

            await sendPageCoingeckoMock.changeNetwork(network);
            await sendPageCoingeckoMock.setAddressTo(addressTo);
            await sendPageCoingeckoMock.setAmount(amount);
            await balancePromise;
            await sleep(FIVE_SECONDS); // wait able button "change network"

            await expect(sendPageCoingeckoMock.page).toHaveScreenshot();

            await sendPageCoingeckoMock.modifyDataByPostTxRequest(mockPostTransactionsRouteSendReject, mockPostTransactionsWsByCreateEventSendMockTx);
            await sendPageCoingeckoMock.modifyDataByPutTxRequest(
                mockPutTransactionsRouteSendReject,
                mockPutTransactionsWsByUpdateTransactionEventInProgressSendReject,
            );
            await sendPageCoingeckoMock.clickConfirm();

            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await expect(sendPageCoingeckoMock.page).toHaveScreenshot();
            await notifyMM.changeNetwork();

            const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            const recipientAddress = await notifyMMtx.getReceiverAddress();
            expect(recipientAddress).toBe(addressTo);

            const amountFromMM = await notifyMMtx.getAmount();
            expect(amountFromMM).toBe(amount);

            await expect(sendPageCoingeckoMock.page).toHaveScreenshot({
                maxDiffPixels: 240,
            });

            await notifyMMtx.rejectTx();
            await sendPageCoingeckoMock.getBaseContentElement().hover();
            await expect(sendPageCoingeckoMock.page).toHaveScreenshot();

            // await notifyMM.signTx();
            // expect(await sendPage.getLinkFromSuccessPanel()).toContain(txHash);
            // TODO нужен тест на отправку НЕ нативного токена (например USDC)
            // TODO нужен тест когда отменяем переключение сети ММ (скрином проверять текст ошибки)
        },
    );

    testMetaMask('Case#: Checking the token change when changing the network via MM', async ({ browser, context, page, sendPage }) => {
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
        const network = 'cosmos';
        const addressFrom = 'cosmos1aascfnuh7dpup8cmyph2l0wgee9d2lchdlx00r';
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network}**`;

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceCosmosWallet, addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);

        await balancePromise;

        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
    });

    testKeplr('Case#: Send with memo and check memo in keplr', async ({ browser, context, page, sendPage }) => {
        const network = 'cosmos';
        const addressFrom = 'cosmos1aascfnuh7dpup8cmyph2l0wgee9d2lchdlx00r';
        const addressTo = COSMOS_NETWORKS[network];
        const WAITED_URL = `**/srv-data-provider/api/balances?net=${network}**`;
        const amount = '0.001';
        const memo = '105371789';

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceCosmosWallet[network], addressFrom);
        const balancePromise = sendPage.page.waitForResponse(WAITED_URL);

        await balancePromise;

        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);
        await sendPage.setMemoCheckbox();
        await sendPage.setMemo(memo);

        await sendPage.clickConfirm();

        const notifyMM = new KeplrNotifyPage(await getNotifyKeplrPage(context));
        const result = await notifyMM.page.innerText('div.djtFnd');

        expect(result).toBe(memo);
    });
});
