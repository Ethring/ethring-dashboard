import { test, expect } from '../__fixtures__/fixtures';
import { MetaMaskNotifyPage } from '../model/metaMaskPages';
const sleep = require('util').promisify(setTimeout);

const supportedNetsBySwap = ['Ethereum', 'Binance Smart Chain', 'Arbitrum', 'Polygon', 'Avalanche', 'Optimism', 'Fantom'];

test('Swap tx', async ({ browser, context, page: Page, swapPage }) => {
    await swapPage.swapTokens('0.0001');

    const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
    await notyfMM.signTx();

    expect(await swapPage.getLinkFromSuccessPanell()).toContain('0x722a02331325f538c740391d0d0948935250e19eda6cf355b0c89198d2f8a0e4');
});

for (const net of supportedNetsBySwap) {
    test.skip(`Assert dublicate tokens in net ${net}`, async ({ browser, context, page: Page, swapPage }) => {
        const needAddNetInMm = await swapPage.changeNetworkBySwap(net);
        if (needAddNetInMm) {
            const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
            await notyfMM.addAndAcceptChangeNetwork();
        }

        await sleep(3000);

        await swapPage.page.click('(//div[@data-qa="select-token"])[2]');

        const tokensCodeLocators = await swapPage.page.locator('//div[@class="select-token__item"]//span[@class="symbol"]').all();
        const codeArr: string[] = await Promise.all(
            tokensCodeLocators.map(async (locator) => {
                const text = await locator.textContent();
                return text ?? '';
            })
        );

        function findDuplicates(arr: any[]): any[] {
            const duplicates: any[] = [];
            const countMap: { [key: string]: number } = {};

            for (const element of arr) {
                countMap[element] = (countMap[element] || 0) + 1;
                if (countMap[element] > 1) {
                    duplicates.push(element);
                }
            }

            return duplicates;
        }

        expect(findDuplicates(codeArr)).toEqual([]);
    });
}

test('Try change token after change network', async ({ browser, context, page: Page, swapPage }) => {
    const testedNet = 'Arbitrum';
    const tokenFrom = 'SUSHI';

    await swapPage.changeNetworkBySwap(testedNet);

    const notyfMM = new MetaMaskNotifyPage(context.pages()[2]);
    await notyfMM.addAndAcceptChangeNetwork();

    expect(await swapPage.getCurrentNetInSwap()).toContain(testedNet);
    await swapPage.setTokenFromInSwap(tokenFrom);

    const result = await swapPage.getTokenFrom();
    expect(result).toBe(tokenFrom);
});

test('Assert networks name', async ({ browser, context, page: Page, swapPage }) => {
    await swapPage.openAccordionWithNetworks();

    const netsLocatorList = await swapPage.page.locator('//div[@class="select__items"]//div[text()]').all();

    const netsNameList: string[] = await Promise.all(
        netsLocatorList.map(async (locator) => {
            const text = await locator.textContent();
            return text ?? '';
        })
    );

    expect(netsNameList).toStrictEqual(supportedNetsBySwap);
});

test('Swap in Poligon: Matic to USDC', async ({ browser, context, page: Page, swapPage }) => {
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
