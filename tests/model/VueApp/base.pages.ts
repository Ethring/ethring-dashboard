import { BrowserContext, Page, Route } from '@playwright/test';
import { FIVE_SECONDS, ONE_SECOND } from '../../__fixtures__/fixtureHelper';
import { DATA_QA_LOCATORS } from '../../data/constants';
import util from 'util';

const url: string = '/';
const sleep = util.promisify(setTimeout);

enum Modules {
    send = 'send',
    swap = 'swap',
    bridge = 'bridge',
    superSwap = 'superSwap',
}

type ModuleNames = keyof typeof Modules;

class BasePage {
    readonly page: Page;

    readonly sideBarLinks = {
        [Modules.send]: DATA_QA_LOCATORS.SIDEBAR_SEND,
        [Modules.swap]: DATA_QA_LOCATORS.SIDEBAR_SWAP,
        [Modules.bridge]: DATA_QA_LOCATORS.SIDEBAR_BRIDGE,
        [Modules.superSwap]: DATA_QA_LOCATORS.SIDEBAR_SUPER_SWAP,
    };

    readonly modules = {
        [Modules.send]: (page: Page) => new SendPage(page),
        [Modules.swap]: (page: Page) => new SwapPage(page),
        [Modules.bridge]: (page: Page) => new BridgePage(page),
        [Modules.superSwap]: (page: Page) => new SuperSwapPage(page),
    };

    constructor(page: Page) {
        this.page = page;
    }

    async goToPage() {
        await this.page.goto(url);
    }

    // arg context add by debug playwright error
    async clickLoginByMetaMask(context?: BrowserContext) {
        try {
            await this.page.locator('div.wallet-adapter-container').click();
            await this.page.getByTestId(DATA_QA_LOCATORS.EVM_ECOSYSTEM_WALLET).click();
        } catch (e) {
            console.log('\nFirst login by metamask fail:\n', `\t${e}`);
            console.log(context.pages().length);
            console.log(context.pages());
            await context.pages()[1].reload();
            // await this.page.reload();
            // await this.page.locator('div.wallet-adapter-container').click();
            // await this.page.getByTestId('EVM Ecosystem wallet').click();
        }

        await this.page.getByText('MetaMask').click();
    }

    async clickLoginByKeplr() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.getByTestId(DATA_QA_LOCATORS.COSMOS_ECOSYSTEM_WALLET).click();
        await this.page.getByText('Keplr').click();
    }

    async goToModule(module: ModuleNames): Promise<SwapPage | SendPage | BridgePage | SuperSwapPage> {
        const moduleName = this.sideBarLinks[module];
        await this.page.getByTestId(moduleName).click();
        return this.modules[module](this.page);
    }

    async waitMainElementVisible() {
        await this.page.getByTestId(DATA_QA_LOCATORS.DASHBOARD).waitFor({ state: 'visible', timeout: 20000 });
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
        await this.mockRoute(URL, mockData, statusCode);
    }

    async mockAnyNetworkBalanceRequest(networks: string[], mockData: object, address: string) {
        await Promise.all(networks.map((network) => this.mockBalanceRequest(network, mockData, address)));
    }

    async mockEstimateSwapRequest(service: 'srv-paraswap' | 'srv-synapse-swap', mockData: object, statusCode = 200) {
        const URL = `**/${service}/api/estimateSwap**`;
        await this.mockRoute(URL, mockData, statusCode);
    }

    async mockTokensList(net: string, tokensList: object) {
        const URL = `**/networks/${net}/tokens`;
        this.mockRoute(URL, tokensList, 200);
    }

    async mockRoute(url: string, mockData: object, statusCode: number = 200): Promise<any> {
        return this.page.route(url, (route) => {
            route.fulfill({
                status: statusCode,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify(mockData),
            });
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
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//div[text()="${netName}"]`).click();
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
        let images = await this.page.locator('//img').all();
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

    async handleRequestWithModification(route: Route, method: String, httpData: Object, wsData: Object) {
        if (route.request().method() === method) {
            const body = JSON.parse(route.request().postData());
            body.expectedDataHttp = httpData;
            body.expectedDataWs = wsData;

            const override = { postData: JSON.stringify(body) };
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
    async modifyDataByPostTxRequest(dataToReturnInHttpResponse: Object, dataToReturnInWsResponse: Object) {
        return await this.page.route(/\/transactions$/, (route) =>
            this.handleRequestWithModification(route, 'POST', dataToReturnInHttpResponse, dataToReturnInWsResponse),
        );
    }

    /**
     * This method is designed to modify the data in a PUT request for /transaction/{:id} path.
     *
     * @param {Object} dataToReturnInHttpResponse - This object was returned from stub-tx-manager as HTTP response.
     * @param {Object} dataToReturnInWsResponse - This object was returned from stub-tx-manager as WS event.
     */
    async modifyDataByPutTxRequest(dataToReturnInHttpResponse: Object, dataToReturnInWsResponse: Object) {
        return await this.page.route(/\/transactions\/\d{4}$/, (route) =>
            this.handleRequestWithModification(route, 'PUT', dataToReturnInHttpResponse, dataToReturnInWsResponse),
        );
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

class BridgePage extends BasePage { }

class SendPage extends BasePage {
    async setNetworkTo(netName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_NETWORK).click();
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//div[text()="${netName}"]`).click();
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

    async getTokenTo() {
        return await this.page.locator(`(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"]/div[@class="token"])[2]`).textContent();
    }
}

class SuperSwapPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async setNetworkFrom(netName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_BLOCK).nth(0).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.ITEM).filter({ hasText: netName }).click();
    }

    async setTokenFrom(tokenName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_BLOCK).nth(1).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.ITEM).filter({ hasText: tokenName }).click();
    }

    async setNetworkTo(netName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_BLOCK).nth(2).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.ITEM).filter({ hasText: netName }).click();
    }

    async setTokenTo(tokenName: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.SELECT_BLOCK).nth(3).click();
        await this.page.getByTestId(DATA_QA_LOCATORS.ITEM).filter({ hasText: tokenName }).click();
    }

    async setAmount(amount: string) {
        await this.page.getByTestId(DATA_QA_LOCATORS.INPUT_AMOUNT).nth(0).fill(amount);
    }

    async setFromNetAmount(net: string, amount: string) {
        await this.setNetworkFrom(net);
        await this.setAmount(amount);
    }

    async setFromNetTokenAmount(net: string, token: string, amount: string) {
        await this.setNetworkFrom(net);
        await this.setTokenFrom(token);
        await this.setAmount(amount);
    }

    async setToNetToken(net: string, token: string) {
        await this.setNetworkTo(net);
        await this.setTokenTo(token);
    }

    async openRouteInfo() {
        await this.page.getByTestId(DATA_QA_LOCATORS.ROUTE_INFO).click();
    }

    async getTokenTo() {
        return await this.page.locator(`(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"]/div[@class="token"])[2]`).textContent();
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

    async openTokenPageTo() {
        await this.page.locator(`${this.TOKEN_ITEM_XPATH}[2]`).click();
    }

    async setTokenInTokensList(token: String) {
        await this.page.locator(`//div[@data-qa="${DATA_QA_LOCATORS.TOKEN_RECORD}"]//div[@class="top"][text()="${token}"]`).click();
    }

    async getTokenFrom() {
        return await this.page.locator(`(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"]/div[@class="token"])[1]`).textContent();
    }

    async getTokenTo() {
        return await this.page.locator(`(//*[@data-qa="${DATA_QA_LOCATORS.SELECT_TOKEN}"]/div[@class="token"])[2]`).textContent();
    }
}

export { BasePage, DashboardPage, BridgePage, SendPage, SuperSwapPage, SwapPage };
