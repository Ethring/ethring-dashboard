import { test, expect } from '../__fixtures__/fixtures';
import { TEST_CONST, getTestVar } from '../envHelper';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
import { getNotifyMmPage } from '../model/metaMaskPages';

const supportedNetsBySwap = ['Ethereum', 'Binance Smart Chain', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Fantom'];
const txHash = getTestVar(TEST_CONST.SUCCESS_TX_HASH_BY_MOCK);

test('Case#1: Swap tx', async ({ browser, context, page: Page, swapPage }) => {
    const amount = '0.0001';
    
    await swapPage.swapTokens(amount);

    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.signTx();

    expect(await swapPage.getLinkFromSuccessPanel()).toContain(txHash);
});

test('Case#2: Try change token after change network', async ({ browser, context, page: Page, swapPage }) => {
    const net = 'Arbitrum';
    const tokenFrom = 'SUSHI';

    await swapPage.changeNetworkBySwap(net);

    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.addAndAcceptChangeNetwork();

    expect(await swapPage.getCurrentNetInSwap()).toContain(net);
    await swapPage.setTokenFromInSwap(tokenFrom);

    const result = await swapPage.getTokenFrom();
    expect(result).toBe(tokenFrom);
});

test('Case#3: Assert networks name', async ({ browser, context, page: Page, swapPage }) => {
    const netsLocator = '//div[@class="select__items"]//div[text()]';

    await swapPage.openAccordionWithNetworks();

    const netsList = await swapPage.page.locator(netsLocator).all();

    const netsNameList: string[] = await Promise.all(
        netsList.map(async (locator) => {
            const text = await locator.textContent();
            return text ?? '';
        })
    );

    expect(netsNameList).toStrictEqual(supportedNetsBySwap);
});

test('Case#4: Swap in Polygon: Matic to USDC', async ({ browser, context, page: Page, swapPage }) => {
    const testedNet = 'Polygon';
    const tokenFrom = 'MATIC';

    await swapPage.changeNetworkBySwap(testedNet);

    const notifyMM = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM.addAndAcceptChangeNetwork();

    expect(await swapPage.getCurrentNetInSwap()).toContain(testedNet);
    await swapPage.setTokenFromInSwap(tokenFrom);

    await swapPage.swapTokens('0.1');
    const notifyMM2 = new MetaMaskNotifyPage(await getNotifyMmPage(context));
    await notifyMM2.signTx();

    expect(await swapPage.getLinkFromSuccessPanel()).toContain(txHash);
});
