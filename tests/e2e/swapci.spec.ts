import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
const sleep = require('util').promisify(setTimeout);

const supportedNetsBySwap = ['Ethereum', 'Binance Smart Chain', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Fantom'];

test('Try change token after change network', async ({ browser, context, page: Page, swapPage }) => {
    const testedNet = 'Polygon';
    const tokenFrom = 'MATIC';

    await swapPage.changeNetworkBySwap(testedNet);

    const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
    await notyfMM.addAndAcceptChangeNetwork();

    expect(await swapPage.getCurrentNetInSwap()).toContain(testedNet);
    await swapPage.setTokenFromInSwap(tokenFrom);

    await swapPage.swapTokens('0.1');
    const notyfMM2 = new MetaMaskNotifyPage(context.pages()[2]);
    await notyfMM2.signTx();

    expect(await swapPage.getLinkFromSuccessPanell()).toContain('0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4');
});
