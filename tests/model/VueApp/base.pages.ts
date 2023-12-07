import { Page } from '@playwright/test';
import { FIVE_SECONDS } from '../utils';

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

    async clickLoginByMetaMask() {
        await this.page.locator('div.wallet-adapter-container').click();
        await this.page.getByTestId('EVM Ecosystem wallet').click();
        await this.page.getByText('MetaMask').click();
    }

    async goToModule(module: string = 'send|swap|bridge|superSwap') {
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
        await this.page.route(URL, (route) => {
            route.fulfill({
                status: statusCode,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify(mockData),
            });
        });
    }

    async mockEstimateSwapRequest(service: 'srv-paraswap' | 'srv-synapse-swap', mockData: object, addressFrom: string, statusCode = 200) {
        const URL = `**/${service}/api/estimateSwap?net=polygon&fromTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&toTokenAddress=0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f&amount=0.01&ownerAddress=${addressFrom}`;

        await this.page.route(URL, (route) => {
            route.fulfill({
                status: statusCode,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify(mockData),
            });
        });
    }

    async mockRoute(url: string, mockData: object) {
        await this.page.route(url, (route) => {
            route.fulfill({
                status: 200,
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
        this.page.waitForSelector('div.loading-overlay', { state: 'detached', timeout: 60000 });
    }

    async waitDetachedSkeleton() {
        this.page.waitForSelector('div.ant-skeleton-active', { state: 'detached', timeout: 60000 });
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
    async swapTokens(amount: string) {
        await this.page.locator("//div[text() = 'Pay']/following-sibling::div//input").fill(amount);
        await this.page.click('button.simple-swap__btn');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await sleep(FIVE_SECONDS);
    }

    async setTokenFromInSwap(token: String) {
        await this.page.locator('(//*[@data-qa="select-token"])[1]').click();
        await this.page.locator(`//div[@class="select-token__item"]//div[text()="${token}"]`).click();
    }

    async getTokenFrom() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[1]').textContent();
    }

    async getTokenTo() {
        return await this.page.locator('(//*[@data-qa="select-token"]/div[@class="token"])[2]').textContent();
    }

    async setTokenToInSwap(token: String) {
        this.page.locator('(//*[@data-qa="select-token"])[2]');
        await this.page.locator(`//div[@class="select-token__item"]//div[text()="${token}"]`).click();
    }
}

export { BasePage, DashboardPage, BridgePage, SendPage, SuperSwapPage, SwapPage };
