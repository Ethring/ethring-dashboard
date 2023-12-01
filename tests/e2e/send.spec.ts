import { Page } from '@playwright/test';
import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { getTestVar, TEST_CONST } from '../envHelper';
import { getNotifyMmPage, getHomeMmPage, sleepFiveSecond } from '../model/metaMaskPages';
import {  mockBalanceDataBySendTest } from '../data/mockHelper';

test.describe('Send e2e tests', () => {
    test('Case#1: Reject send native token to another address in Avalanche with change MM network', async ({
        browser,
        context,
        page: Page,
        sendPage,
    }) => {
        const network = 'Avalanche';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
        const addressTo = getTestVar(TEST_CONST.RECIPIENT_ADDRESS);
        const amount = '0.001';

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest.avalanche, addressFrom);

        await sendPage.changeNetwork(network);
        await sendPage.setAddressTo(addressTo);
        await sendPage.setAmount(amount);
        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

        await sendPage.clickConfirm();

        const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
        await notifyMM.changeNetwork();

        const notifyMMtx = new MetaMaskNotifyPage(await getNotifyMmPage(context));
        const recipientAddress = await notifyMMtx.getReceiverAddress();
        const amountFromMM = await notifyMMtx.getAmount();

        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
        expect(recipientAddress).toBe(addressTo);
        expect(amountFromMM).toBe(amount);

        await notifyMMtx.rejectTx();
        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();

        // await notifyMM.signTx();
        // expect(await sendPage.getLinkFromSuccessPanel()).toContain(txHash);
        // TODO нужен тест на отправку НЕ нативного токена (например USDC)
        // TODO нужен тест когда отменяем переключение сети ММ (скрином проверять текст ошибки)
    });

    test('Case#2: Checking the token change when changing the network via MM', async ({ browser, context, page: Page, sendPage }) => {
        const network = 'Polygon';
        const networkNameInMm = 'Polygon Mainnet';
        const addressFrom = getTestVar(TEST_CONST.ETH_ADDRESS_TX);

        await sendPage.mockBalanceRequest(network.toLowerCase(), mockBalanceDataBySendTest.polygon, addressFrom);

        const homeMmPage = await getHomeMmPage(context);
        await homeMmPage.addNetwork(networkNameInMm);
        await sleepFiveSecond(); // wait load image

        await expect(sendPage.getBaseContentElement()).toHaveScreenshot();
    });
});
