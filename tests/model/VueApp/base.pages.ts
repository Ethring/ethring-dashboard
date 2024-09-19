import { Page, Route, expect } from '@playwright/test';
import { FIVE_SECONDS, ONE_SECOND } from '../../__fixtures__/fixtureHelper';
import { DATA_QA_LOCATORS, URL_MOCK_PATTERNS } from '../../data/constants';
import util from 'util';
import { emptyBalanceMockData } from '../../data/mockHelper';

const url: string = '/';
const sleep = util.promisify(setTimeout);

enum Modules {
    send = 'send',
    swap = 'swap',
    bridge = 'bridge',
    superSwap = 'superSwap',
    shortcut = 'shortcut',
    dashboard = 'main',
}

type ModuleNames = keyof typeof Modules;

class BasePage {
    readonly page: Page;

    readonly sideBarLinks = {
        // [Modules.send]: DATA_QA_LOCATORS.SIDEBAR_SEND,
        // [Modules.swap]: DATA_QA_LOCATORS.SIDEBAR_SWAP,
        // [Modules.bridge]: DATA_QA_LOCATORS.SIDEBAR_BRIDGE,
        [Modules.superSwap]: DATA_QA_LOCATORS.SIDEBAR_SUPER_SWAP,
        [Modules.shortcut]: DATA_QA_LOCATORS.SIDEBAR_SHORTCUT,
        [Modules.dashboard]: DATA_QA_LOCATORS.DASHBOARD,
    };

    readonly modules = {
        [Modules.send]: (page: Page) => new SendPage(page),
        // [Modules.swap]: (page: Page) => new SwapPage(page),
        // [Modules.bridge]: (page: Page) => new BridgePage(page),
        [Modules.superSwap]: (page: Page) => new SuperSwapPage(page),
        [Modules.shortcut]: (page: Page) => new ShortcutPage(page),
        [Modules.dashboard]: (page: Page) => new DashboardPage(page),
    };

    constructor(page: Page) {
        this.page = page;
    }

    async goToPage(page = url) {
        await this.page.goto(page);
    }

    async clickLoginByMetaMask() {
        try {
            await this.page.locator('div.wallet-adapter-container').click();
            await this.page.getByTestId(DATA_QA_LOCATORS.EVM_ECOSYSTEM_WALLET).click();
        } catch (e) {
            console.log('\nFirst login by metamask fail:\n', `\t${e}`);
        }

        await this.page.getByText('MetaMask').click();
    }

    async clickLoginByKeplr() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.getByTestId(DATA_QA_LOCATORS.COSMOS_ECOSYSTEM_WALLET).click();
        await this.page.getByText('Keplr').click();
    }

    async disconnectFirstWallet() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.locator("(//div[@class='connected-wallet']//a/span)[1]").hover();
        await this.page.locator("(//div[@class='wallet__options-item'])[2]//div[text()='Disconnect']").click();
    }

    async disconnectAllWallets() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.locator('div.disconnect-all').first().click();
    }

    async goToModule(module: ModuleNames): Promise<SendPage | SuperSwapPage | ShortcutPage> {
        const moduleName = this.sideBarLinks[module];
        await this.page.getByTestId(moduleName).click();
        return this.modules[module](this.page);
    }

    async waitMainElementVisible() {
        await this.page.getByTestId(DATA_QA_LOCATORS.SHORTCUTS).waitFor({ state: 'visible', timeout: 20000 });
    }

    async getLinkFromSuccessPanel() {
        return await this.page.locator('//div[@class="success info-panel mt-10"]//a').getAttribute('href');
    }

    getBaseContentElement() {
        return this.page.getByTestId(DATA_QA_LOCATORS.CONTENT);
    }

    getSelectModalContent() {
        return this.page.getByTestId(DATA_QA_LOCATORS.RECORD_MODAL);
    }

    async clickConfirm() {
        await this.page.getByTestId(DATA_QA_LOCATORS.CONFIRM).click();
        await sleep(10000);
    }

    async mockBalanceRequest(net: string, mockData: object, address: string, statusCode: number = 200) {
        const URL = `**/srv-data-provider/api/balances?net=${net}&address=${address}**`;
        await this.mockRoute(URL, mockData || emptyBalanceMockData, statusCode);
    }

    async mockPoolBalanceRequest(net: string, mockData: object, address: string, statusCode: number = 200) {
        const URL = `**/api/balances?provider=Portal?net=${net}&address=${address}**`;
        await this.mockRoute(URL, mockData, statusCode);
    }

    async mockAnyNetworkBalanceRequest(networks: string[], mockData: object, address: string) {
        await Promise.all(networks.map((network) => this.mockBalanceRequest(network, mockData, address)));
    }

    async mockEstimateSwapRequest(mockData: object, statusCode = 200) {
        await this.mockRoute(URL_MOCK_PATTERNS.MOCK_SWAP, mockData, statusCode);
    }

    async mockEstimateBridgeRequest(mockData: object, statusCode = 200) {
        await this.mockRoute(URL_MOCK_PATTERNS.MOCK_BRIDGE, mockData, statusCode);
    }

    async mockEstimateRemoveLpRequest(mockData: object, statusCode = 200) {
        await this.mockRoute(URL_MOCK_PATTERNS.MOCK_REMOVE_LP, mockData, statusCode);
    }

    async mockTokensList(net: string, tokensList: object) {
        const URL = `**/networks/${net}/tokens`;
        this.mockRoute(URL, tokensList, 200);
    }

    protected async fullFillRoute(route: Route, data: object, code: number) {
        await route.fulfill({
            status: code,
            contentType: 'application/json; charset=utf-8',
            body: JSON.stringify(data),
        });
    }

    async mockRoute(url: string, mockData: object, statusCode: number = 200): Promise<any> {
        return this.page.route(url, async (route) => {
            await this.fullFillRoute(route, mockData, statusCode);
        });
    }

    async openAccordionWithNetworks() {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).click();
    }

    async getCurrentNet() {
        await sleep(FIVE_SECONDS);
        await this.page.waitForLoadState();
        return await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.SELECT_NETWORK}"]/div[contains(@class, "name")]`).textContent();
    }

    async selectNetwork(netName: string) {
        await this.openAccordionWithNetworks();
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//span[text()="${netName}"]`).click();
        await sleep(ONE_SECOND);
    }

    async changeNetwork(netName: string) {
        let needMmApprove = false;

        if ((await this.getCurrentNet()) !== netName) {
            needMmApprove = true;
            await this.selectNetwork(netName);
        }

        return needMmApprove;
    }

    async waitDetachedLoader() {
        await this.page.waitForSelector('div.loading-overlay', { state: 'detached', timeout: 60000 });
    }

    async waitDetachedSkeleton() {
        await this.page.waitForSelector('div.ant-skeleton-active', { state: 'detached', timeout: 60000 });
    }

    async waitHiddenLoader() {
        await this.page.waitForSelector('div.loading-overlay', { state: 'hidden', timeout: 60000 });
    }

    async waitHiddenSkeleton() {
        await this.page.waitForSelector('div.ant-skeleton-active', { state: 'hidden', timeout: 60000 });
    }

    async waitLoadImg(browser?, context?, page?) {
        const images = await this.page.locator('//img').all();
        try {
            for (const img of images) await img.scrollIntoViewIfNeeded();
        } catch (e) {
            console.log('>>>Start error log\n');
            console.log(e);
            console.log('>>>Start browser log\n');
            console.log(browser, '>>>Finish browser\n', context, '>>>Finish context\n', page, '>>>Finish page\n');
        }

        // const promises = images.map((locator) =>
        //     locator.evaluate((image) => {
        //         console.log('\n2>>>>', image, '\n');
        //         return image.complete || new Promise((f) => (image.onload = f));
        //     })
        // );
        // console.log('>>>4', promises);
        // await Promise.race(promises)
        //     .then((res) => {
        //         console.log('>>>5', res);
        //     })
        //     .catch((e) => {
        //         console.log(e);
        //     });
        // console.log('>>> FINISH');
    }

    async handleRequestWithModification(route: Route, method: string, httpData: object, wsData: object) {
        if (route.request().method() === method) {
            const body = JSON.parse(route.request().postData());
            body.expectedDataHttp = httpData;
            body.expectedDataWs = wsData;

            // Set to expected data hash fake transaction from MM
            if (body.transaction?.hasOwnProperty('txHash') && body.transaction.txHash !== null) {
                body.expectedDataHttp.data.txHash = body.transaction.txHash;
                body.expectedDataWs.txHash = body.transaction.txHash;
            }

            const override = { postData: JSON.stringify(body) };
            route.continue(override);
        } else {
            route.continue();
        }
    }

    async handleGetRequest(route: Route, method: string, httpData: object) {
        if (route.request().method() === method) {
            const headers = route.request().headers();
            headers['Content-Type'] = 'application/json';

            const override = { postData: JSON.stringify(httpData), headers };

            route.continue(override);
        } else {
            route.continue();
        }
    }
    /**
     * This method is designed to modify the data in a POST request for /transaction/.
     *
     * @param {Object} dataToReturnInHttpResponse - This object was returned from stub-tx-manager as HTTP response.
     * @param {Object} dataToReturnInWsResponse - This object was returned from stub-tx-manager as WS event.
     */
    async modifyDataByPostTxRequest(dataToReturnInHttpResponse: object, dataToReturnInWsResponse: object) {
        return await this.page.route(/\/transactions$/, (route) =>
            this.handleRequestWithModification(route, 'POST', dataToReturnInHttpResponse, dataToReturnInWsResponse),
        );
    }

    /**
     * This method is designed to modify the data in a GET request for /transaction/{:id} path.
     *
     * @param {Object} dataToReturnInHttpResponse - This object was returned from stub-tx-manager as HTTP response.
     */
    async modifyDataByGetTxRequest(dataToReturnInHttpResponse: object) {
        return await this.page.route(/\/transactions\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, (route) => {
            this.handleGetRequest(route, 'GET', dataToReturnInHttpResponse);
        });
    }

    /**
     * This method is designed to modify the data in a PUT request for /transaction/{:id} path.
     *
     * @param {Object} dataToReturnInHttpResponse - This object was returned from stub-tx-manager as HTTP response.
     * @param {Object} dataToReturnInWsResponse - This object was returned from stub-tx-manager as WS event.
     */
    async modifyDataByPutTxRequest(dataToReturnInHttpResponse: object, dataToReturnInWsResponse: object) {
        return await this.page.route(/\/transactions\/\d+$/, (route) =>
            this.handleRequestWithModification(route, 'PUT', dataToReturnInHttpResponse, dataToReturnInWsResponse),
        );
    }

    /**
     * This method is designed to get payload values from POST getSwapTx request /getSwapTx path.
     */
    async getPayloadOfPostSwapTxRequest() {
        return await this.page.route(/\/getSwapTx$/, (route) => {
            return route.request().postData();
        });
    }

    async assertNotificationByPage(expectNotifyCount: number, expectedNotificationTitle: string, expectedNotificationDescription: string) {
        const txNotification = this.page.locator('div.ant-notification-notice');
        const txNotificationTitle = this.page.locator('div.ant-notification-notice-message');
        const txNotificationDesc = this.page.locator('div.ant-notification-notice-description');

        await expect(txNotification).toHaveCount(expectNotifyCount);
        await expect(txNotificationTitle).toHaveText(expectedNotificationTitle);
        await expect(txNotificationDesc).toHaveText(expectedNotificationDescription);
    }

    async waitEventInSocket(waitedEventName: string, timeoutSec: number = 180000) {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Event not received within timeout')), timeoutSec);

            this.page.on('websocket', (ws) => {
                ws.on('framereceived', (event) => {
                    try {
                        const data: string | Buffer = event.payload;
                        if (
                            typeof data !== 'string' ||
                            data[0] === '0' ||
                            data[0] === '2' ||
                            data[0] === '40' ||
                            data === '{"type":"connected"}'
                        )
                            return;

                        console.log('>>>', data);
                        const responseEventName = JSON.parse(data.substring(2))[0];

                        if (waitedEventName === responseEventName) {
                            clearTimeout(timeout);
                            resolve();
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                });
            });
        });
    }
}

class DashboardPage extends BasePage {
    async setFocusToFirstSpan() {
        const assetPanel = this.page.getByTestId(DATA_QA_LOCATORS.ASSETS_PANEL);
        return await assetPanel.evaluate((el) => el.classList.add('active-panel')); //  add new class to element
    }

    async prepareFoScreenShoot() {
        await this.waitHiddenSkeleton();

        // Fix https://github.com/microsoft/playwright/issues/18827#issuecomment-1878770736
        await this.page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        return await this.page.waitForFunction(() => window.scrollY === 0);
    }
}

class BridgePage extends BasePage {
    async setAmount(amount: string) {
        await this.page.waitForSelector('span.ant-skeleton-input', { state: 'hidden', timeout: 10000 });
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).fill(amount);
    }
}

class SendPage extends BasePage {
    async setNetworkTo(netName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).click();
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//span[text()="${netName}"]`).click();
    }

    async setAddressTo(address: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_ADDRESS).fill(address);
    }

    async setAmount(amount: string) {
        await this.page.waitForSelector('span.ant-skeleton-input', { state: 'hidden', timeout: 10000 });
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).fill(amount);
    }

    async setMemoCheckbox() {
        await this.page.getByTestId(DATA_QA_LOCATORS.CHECKBOX).click();
    }

    async setMemo(memo: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.CUSTOM_INPUT).fill(memo);
    }

    async setDataAndClickConfirm(net: string, address: string, amount: string) {
        await this.setNetworkTo(net);
        await this.setAddressTo(address);
        await this.setAmount(amount);
        await this.clickConfirm();
    }
}

class SuperSwapPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async setNetworkFrom(netName: string) {
        await sleep(4000);
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).nth(0).click();
        await sleep(4000);
        await this.page.getByTestId(DATA_QA_LOCATORS.TOKEN_RECORD).filter({ hasText: netName }).click();
    }

    async setTokenFrom(tokenName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).nth(1).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.TOKEN_RECORD).filter({ hasText: tokenName }).click();
    }

    async setNetworkTo(netName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).nth(2).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.TOKEN_RECORD).filter({ hasText: netName }).first().click();
    }

    async setTokenTo(tokenName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).nth(3).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.TOKEN_RECORD).filter({ hasText: tokenName }).first().click();
    }

    async setAmount(amount: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).nth(0).fill(amount);
    }

    async setFromNetAndAmount(net: string, amount: string) {
        await this.setNetworkFrom(net);
        await this.setAmount(amount);
    }

    async setNetToAndTokenTo(net: string, token: string) {
        await this.setNetworkTo(net);
        await this.setTokenTo(token);
    }

    async openRouteInfo() {
        await this.page.getByTestId(DATA_QA_LOCATORS.ROUTE_INFO).click();
    }
}

class SwapPage extends BasePage {
    TOKEN_ITEM_XPATH = `(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"])`;

    async setAmount(amount: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).nth(0).fill(amount);
    }

    async swapTokens(amount: string) {
        await this.setAmount(amount);
        await this.page.click('button.simple-swap__btn');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await sleep(FIVE_SECONDS);
    }

    async openTokenPageFrom() {
        await this.page.locator(`${this.TOKEN_ITEM_XPATH}[1]`).click();
    }

    async clickSwap() {
        await this.page.getByTestId(DATA_QA_LOCATORS.CONFIRM).click();
    }

    async openTokenPageTo() {
        await this.page.locator(`${this.TOKEN_ITEM_XPATH}[2]`).click();
    }

    async setTokenInTokensList(token: string) {
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//span[@class="top"][text()="${token}"]`).click();
    }

    async getTokenFrom() {
        return await this.page.locator(`(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"]/div[@class="token"])[1]`).textContent();
    }

    async openSlippageDropdown() {
        await this.page.getByTestId(DATA_QA_LOCATORS.SLIPPAGE_ICON).click();
    }

    async setCustomSlippage(slippage: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SLIPPAGE_CUSTOM).nth(0).click();
        await this.page.locator(`(//div[@data-qa="${DATA_QA_LOCATORS.SLIPPAGE_CUSTOM_INPUT}"]//input)[1]`).fill(slippage);
    }
}

class ShortcutPage extends BasePage {
    async setAmount(amount: string) {
        await sleep(4000);
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).nth(0).fill(amount);
    }

    async clickFirstShortcut() {
        await this.page.locator(`//div[@class="shortcut-item__body"]`).nth(0).click();
    }

    async clickShortcutById(id: string) {
        await this.page.locator(`//div[@data-qa="${id}"]`).click();
    }

    // * @matcherData is object were key is matcher string and value is mocked data
    async mockRouteByDataRequestMatcher(url: string, matcherData: object, statusCode: number = 200): Promise<any> {
        return this.page.route(url, async (route) => {
            const requestBody = route.request().postData();
            const mockData: object = matcherData[Object.keys(matcherData).find((matcher: string) => requestBody.includes(matcher.trim()))];
            await this.fullFillRoute(route, mockData, statusCode);
        });
    }

    async mockEstimateBridgeRequestByRequestDataMatcher(mockDataMatcher: object) {
        await this.mockRouteByDataRequestMatcher(URL_MOCK_PATTERNS.MOCK_BRIDGE, mockDataMatcher, 200);
    }

    async mockEstimateDexRequestByRequestDataMatcher(mockDataMatcher: object) {
        await this.mockRouteByDataRequestMatcher(URL_MOCK_PATTERNS.MOCK_SWAP, mockDataMatcher, 200);
    }
}

export { BasePage, DashboardPage, BridgePage, SendPage, SuperSwapPage, SwapPage, ShortcutPage };
