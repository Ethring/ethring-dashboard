import { Page } from '@playwright/test';
import { FIVE_SECONDS } from '../../__fixtures__/fixtureHelper';

const url: string = '/';
const sleep = require('util').promisify(setTimeout);

class BasePage {
    readonly page: Page;

    readonly sideBarLinks = {
        send: 'sidebar-item-send',
        swap: 'sidebar-item-swap',
        bridge: 'sidebar-item-bridge',
        superSwap: 'sidebar-item-superSwap',
    };

    readonly modules = {
        send: (page: Page) => new SendPage(page),
        swap: (page: Page) => new SwapPage(page),
        bridge: (page: Page) => new BridgePage(page),
        superSwap: (page: Page) => new SuperSwapPage(page),
    };

    constructor(page: Page) {
        this.page = page;
    }

    async goToPage() {
        await this.page.goto(url);
    }

    async clickLoginByMetaMask(context?: any) {
        try {
            await this.page.locator('div.wallet-adapter-container').click();
            await this.page.getByTestId('EVM Ecosystem wallet').click();
        } catch (e) {
            console.log('\nFirst login by metamask fail:\n', `\t${e}`);
            console.log(context);
            await this.page.reload();
            await this.page.locator('div.wallet-adapter-container').click();
            await this.page.getByTestId('EVM Ecosystem wallet').click();
        }

        await this.page.getByText('MetaMask').click();
    }

    async clickLoginByKeplr() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.getByTestId('Cosmos Ecosystem wallet').click();
        await this.page.getByText('Keplr').click();
    }

    async goToModule(module: string = 'send|swap|bridge|superSwap'): Promise<SendPage | SwapPage | BridgePage | SuperSwapPage> {
        const moduleName = this.sideBarLinks[module];
        await this.page.getByTestId(moduleName).click();
        return this.modules[module](this.page);
    }

    async waitMainElementVisible() {
        await this.page.getByTestId('dashboard').waitFor({ state: 'visible', timeout: 20000 });
    }

    async getLinkFromSuccessPanel() {
        return await this.page.locator('//div[@class="success info-panel mt-10"]//a').getAttribute('href');
    }

    getBaseContentElement() {
        return this.page.getByTestId('content');
    }

    async clickConfirm() {
        await this.page.getByTestId('confirm').click();
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
        await this.page.getByTestId('select-network').click();
    }

    async getCurrentNet() {
        await sleep(FIVE_SECONDS);
        await this.page.waitForLoadState();
        return await this.page.locator('//div[@data-qa="select-network"]//div[@class="name"]').textContent();
    }

    async selectNetwork(netName: string) {
        await this.openAccordionWithNetworks();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
        await sleep(FIVE_SECONDS);
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

    async waitLoadImg() {
        let images = await this.page.locator('//img').all();
        for (const img of images) await img.scrollIntoViewIfNeeded();

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
}

class DashboardPage extends BasePage {}

class BridgePage extends BasePage {}

class SendPage extends BasePage {
    async setNetworkTo(netName: string) {
        await this.page.getByTestId('select-network').click();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
    }

    async setAddressTo(address: string) {
        await this.page.getByTestId('input-address').fill(address);
    }

    async setAmount(amount: string) {
        await this.page.waitForSelector('span.ant-skeleton-input', { state: 'hidden', timeout: 10000 });
        await this.page.getByTestId('input-amount').fill(amount);
    }

    async setDataAndClickConfirm(net: string, address: string, amount: string) {
        await this.setNetworkTo(net);
        await this.setAddressTo(address);
        await this.setAmount(amount);
        await this.clickConfirm();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}

class SuperSwapPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async setNetworkFrom(netName: string) {
        await this.page.getByTestId('select__block').nth(0).click();
        await this.page.getByTestId('item').filter({ hasText: netName }).click();
    }

    async setTokenFrom(tokenName: string) {
        await this.page.getByTestId('select__block').nth(1).click();
        await this.page.getByTestId('item').filter({ hasText: tokenName }).click();
    }

    async setNetworkTo(netName: string) {
        await this.page.getByTestId('select__block').nth(2).click();
        await this.page.getByTestId('item').filter({ hasText: netName }).click();
    }

    async setTokenTo(tokenName: string) {
        await this.page.getByTestId('select__block').nth(3).click();
        await this.page.getByTestId('item').filter({ hasText: tokenName }).click();
    }

    async setAmount(amount: string) {
        await this.page.getByTestId('input-amount').nth(0).fill(amount);
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
        await this.page.getByTestId('route-info').click();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}

class SwapPage extends BasePage {
    TOKEN_ITEM_XPATH = '(//*[@data-qa="select-token"])';

    async setAmount(amount: string) {
        await this.page.locator("//div[text() = 'Pay']/following-sibling::div//input").fill(amount);
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
        await this.page.locator(`//div[@data-qa="token-record"]//div[text()="${token}"]`).click();
    }

    async getTokenFrom() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[1]').textContent();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }
}

export { BasePage, DashboardPage, BridgePage, SendPage, SuperSwapPage, SwapPage };
