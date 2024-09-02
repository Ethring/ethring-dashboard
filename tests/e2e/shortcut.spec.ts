import { expect } from '@playwright/test';
import util from 'util';
import { testMetaMaskAndKeplr, testMetaMask } from '../__fixtures__/fixtures';
import { FIVE_SECONDS, ONE_SECOND } from '../__fixtures__/fixtureHelper';
import { TEST_CONST, getTestVar } from '../envHelper';
import { mockPoolBalanceDataArbitrum, estimateRemoveLpMockData } from '../data/mockHelper';

const sleep = util.promisify(setTimeout);

testMetaMaskAndKeplr('Case#: Shortcut disconnect wallet', async ({ context, shortcutPage }) => {
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
