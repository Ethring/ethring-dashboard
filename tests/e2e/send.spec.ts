import { testKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { expect } from '@playwright/test';
import { getTestVar, TEST_CONST } from '../envHelper';
import { emptyBalanceMockData, mockBalanceCosmosWallet, mockBalanceDataBySendTest } from '../data/mockHelper';
import { MetaMaskNotifyPage, getNotifyMmPage, getHomeMmPage } from '../model/MetaMask/MetaMask.pages';
import { EVM_NETWORKS } from '../data/constants';

testMetaMask.describe('MetaMask Send e2e tests', () => {
    testMetaMask(
        'Case#: Reject send native token to another address in Avalanche with change MM network',
        async ({ browser, context, page, sendPage }) => {
            const network = 'Avalanche';
            const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
            const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
            const amount = '0.001';

            const INDEX_AVALANCHE = EVM_NETWORKS.indexOf(network.toLowerCase());
            let EMPTY_BALANCE_NETS_MOCK = [...EVM_NETWORKS];
            EMPTY_BALANCE_NETS_MOCK.splice(INDEX_AVALANCHE, 1);
            const WAITED_URL = `**/srv-data-provider/api/balances?net=${network.toLowerCase()}**`;

            await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest[network.toLowerCase()], addressFrom);
            await Promise.all(
                EMPTY_BALANCE_NETS_MOCK.map((network) => sendPage.mockBalanceRequest(network, emptyBalanceMockData, addressFrom))
            );
            const balancePromise = sendPage.page.waitForResponse(WAITED_URL);

            await sendPage.changeNetwork(network);
            await sendPage.setAddressTo(addressTo);
            await sendPage.setAmount(amount);
            await balancePromise;

            await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

            await sendPage.clickConfirm();

            const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
            await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
            await notifyMM.changeNetwork();

            const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));

            const recipientAddress = await notifyMMtx.getReceiverAddress();
            expect(recipientAddress).toBe(addressTo);

            const amountFromMM = await notifyMMtx.getAmount();
            expect(amountFromMM).toBe(amount);

            await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

            await notifyMMtx.rejectTx();
            await sendPage.getBaseContentElement().hover();
            await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

            // await notifyMM.signTx();
            // expect(await sendPage.getLinkFromSuccessPanel()).toContain(txHash);
            // TODO нужен тест на отправку НЕ нативного токена (например USDC)
            // TODO нужен тест когда отменяем переключение сети ММ (скрином проверять текст ошибки)
        }
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
});
