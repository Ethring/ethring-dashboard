import { expect } from '@playwright/test';
import util from 'util';
import { testMetaMaskAndKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { FIVE_SECONDS, ONE_SECOND } from '../__fixtures__/fixtureHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { mockPoolBalanceDataArbitrum, estimateRemoveLpMockData, estimateAddLpMockData, estimateAddLpMockData2 } from '../data/mockHelper';

const sleep = util.promisify(setTimeout);

// TODO: Change to Socket realization
testMetaMaskAndKeplr.skip('Case#: Shortcut disconnect wallet', async ({ context, shortcutPage }) => {
    await shortcutPage.clickFirstShortcut();

    await sleep(FIVE_SECONDS);

    await shortcutPage.disconnectAllWallets();

    const currentShortcutTitle = await shortcutPage.page.locator(`//div[@class='shortcut-details']//div[@class='title']`).textContent();

    expect(currentShortcutTitle).toBe('Stake $ATOM, $OSMO, $STARS with Citadel.one');
});

testMetaMask.skip('Case#: Shortcut remove liquidity from pool', async ({ context, shortcutPage }) => {
    const NET = 'arbitrum';
    const ADDRESS = getTestVar(TEST_CONST.ETH_ADDRESS_TX);
    const RemoveLiquidityPoolID = 'SC-remove-liquidity-pool';
    const WAITED_BALANCE_URL = `**/api/balances?provider=Portal?net=${NET}**`;
    const AMOUNT = '0.001';

    await shortcutPage.mockPoolBalanceRequest(NET, mockPoolBalanceDataArbitrum, ADDRESS);
    const balancePromise = shortcutPage.page.waitForResponse(WAITED_BALANCE_URL);

    await balancePromise;

    await sleep(FIVE_SECONDS);

    await shortcutPage.clickShortcutById(RemoveLiquidityPoolID);

    const currentTokenFrom = await shortcutPage.page
        .locator(`//*[@data-qa="select-token"]/div[contains(@class, 'token-symbol')]`)
        .nth(0)
        .textContent();

    expect(currentTokenFrom).toBe(mockPoolBalanceDataArbitrum.data[0].symbol);

    await sleep(ONE_SECOND);

    await shortcutPage.setAmount(AMOUNT);
    await shortcutPage.mockEstimateRemoveLpRequest(estimateRemoveLpMockData, 200);

    await sleep(FIVE_SECONDS);

    const confirmButtonTitle = await shortcutPage.page.locator('.module-layout-view-btn').textContent();

    expect(confirmButtonTitle).toBe('Approve');

    await shortcutPage.clickConfirm();

    // TODO использовать новый кош, так как на этот могут лететь эвенты из тх менеджера во время других тестов. НЕ мокать запрос на получение allowance, подписывать его через фейк evm ноду, далее выполнять сценарий до конца
});

testMetaMask(
    'Case#: Shortcuts estimate output amount without authorization',
    async ({ browser, context, page, unauthShortcutPage: shortcutPage }) => {
        const regexEstimation = /\/getQuoteAddLiquidity/;
        const SHORTCUT_ID = 'sc-beefy-btc-pool';
        const AMOUNT = '0.1';

        await shortcutPage.waitDetachedLoader();

        await shortcutPage.goToModule('shortcut');
        await shortcutPage.clickShortcutById(SHORTCUT_ID);

        await sleep(ONE_SECOND);

        type QueryParamsType = {
            net: string | null;
            poolID: string | null;
            amount: string | null;
            slippageTolerance: string | null;
            tokenAddress: string | null;
        };

        const requests: QueryParamsType[] = [];

        shortcutPage.page.on('request', (data) => {
            if (!regexEstimation.test(data.url())) return;

            const urlParams = new URL(data.url()).searchParams;
            const net = urlParams.get('net');
            const poolID = urlParams.get('poolID');
            const amount = urlParams.get('amount');
            const slippageTolerance = urlParams.get('slippageTolerance');
            const tokenAddress = urlParams.get('tokenAddress');

            requests.push({
                net,
                poolID,
                amount,
                slippageTolerance,
                tokenAddress,
            });
            if (requests.length === 2) {
                expect(requests[0]).toEqual({
                    net: 'arbitrum',
                    poolID: '0xbdf4e730ed5152a7ac646bb7b514ed624e1147c4',
                    amount: (+AMOUNT / 2).toString(),
                    slippageTolerance: '1',
                    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                });
                expect(requests[1]).toEqual({
                    net: 'arbitrum',
                    poolID: '0x7ed37e03d64e6d1c7e315f1faf295f1e3a4b29df',
                    amount: (+AMOUNT / 2).toString(),
                    slippageTolerance: '1',
                    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                });
            }
        });

        await shortcutPage.mockEstimateAddLpRequest('arbitrum', '0xbdf4e730ed5152a7ac646bb7b514ed624e1147c4', estimateAddLpMockData, 200);
        await shortcutPage.mockEstimateAddLpRequest('arbitrum', '0x7ed37e03d64e6d1c7e315f1faf295f1e3a4b29df', estimateAddLpMockData2, 200);

        await shortcutPage.setAmount(AMOUNT);

        await sleep(FIVE_SECONDS);

        const inputAmountStep1 = await shortcutPage.page
            .locator(`//*[@data-qa="from-token"]//div[contains(@class, 'amount-block')]//span`)
            .nth(0)
            .textContent();

        const outputAmountStep1 = await shortcutPage.page
            .locator(`//*[@data-qa="to-token"]//div[contains(@class, 'amount-block')]//span`)
            .nth(0)
            .textContent();

        const inputAmountStep2 = await shortcutPage.page
            .locator(`(//*[@data-qa="from-token"])[2]//div[contains(@class, 'value')]//span`)
            .textContent();

        const outputAmountStep2 = await shortcutPage.page
            .locator(`(//*[@data-qa="to-token"])[2]//div[contains(@class, 'value')]//span`)
            .textContent();

        expect(Number(inputAmountStep1)).toEqual(+AMOUNT / 2);
        expect(Number(outputAmountStep1)).toEqual(+estimateAddLpMockData.data.lpTokenAmount);

        expect(Number(inputAmountStep2)).toEqual(+AMOUNT / 2);
        expect(Number(outputAmountStep2)).toEqual(+estimateAddLpMockData2.data.lpTokenAmount);
    },
);
