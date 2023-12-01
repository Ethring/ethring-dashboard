import { expect, type Locator, type Page } from '@playwright/test';
import { sleepFiveSecond } from './metaMaskPages';

const sleep = require('util').promisify(setTimeout);

const url: string = '/';

class DashboardPage {
    readonly page: Page;

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

    async goToSend() {
        await this.page.getByTestId('sidebar-item-send').click();
        return new SendPage(this.page);
    }

    async goToSwap() {
        await this.page.getByTestId('sidebar-item-swap').click();
        await this.page.waitForLoadState();
        return new SwapPage(this.page);
    }

    async goToBridge() {
        await this.page.getByTestId('sidebar-item-bridge').click();
        await this.page.waitForLoadState();
        return new BridgePage(this.page);
    }

    async goToSuperSwap() {
        await this.page.getByTestId('sidebar-item-superSwap').click();
        return new SuperSwapPage(this.page);
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

    async mockBalanceRequest(net: string, mockData: object, address: string) {
        await this.page.route(`**/srv-data-provider/api/balances?net=${net}&address=${address}**`, (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json; charset=utf-8',
                body: JSON.stringify(mockData),
            });
        });
    }

    async mockEstimateSwapRequest(
        service: 'srv-paraswap' | 'srv-synapse-swap',
        mockData: object,
        addressFrom: string,
        statusCode = 200
    ) {
        await this.page.route(
            `**/${service}/api/estimateSwap?net=polygon&fromTokenAddress=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&toTokenAddress=0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f&amount=0.01&ownerAddress=${addressFrom}`,
            (route) => {
                route.fulfill({
                    status: statusCode,
                    contentType: 'application/json; charset=utf-8',
                    body: JSON.stringify(mockData),
                });
            }
        );
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
}

class AccordionNetworkModule extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }

    async openAccordionWithNetworks() {
        await this.page.getByTestId('select-network').click();
    }

    async getCurrentNet() {
        await sleepFiveSecond();
        await this.page.waitForLoadState();
        return await this.page.locator('//div[@data-qa="select-network"]//div[@class="name"]').textContent();
    }

    async selectNetwork(netName: string) {
        await this.openAccordionWithNetworks();
        await this.page.locator(`//div[@class="select__items"]//div[text()="${netName}"]`).click();
        await sleepFiveSecond();
    }

    async changeNetwork(netName: string) {
        let needMmApprove = false;
        if ((await this.getCurrentNet()) !== netName) {
            needMmApprove = true;
            await this.selectNetwork(netName);
        }
        return needMmApprove;
    }
}

class SwapPage extends AccordionNetworkModule {
    constructor(page: Page) {
        super(page);
    }

    async swapTokens(amount: string) {
        await this.page.locator("//div[text() = 'Pay']/following-sibling::div//input").fill(amount);
        await this.page.click('button.simple-swap__btn');
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await sleepFiveSecond();
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
        await this.page.locator('(//*[@data-qa="select-token"])[2]');
        await this.page.locator(`//div[@class="select-token__item"]//div[text()="${token}"]`).click();
    }
}

class SuperSwapPage extends DashboardPage {
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

class SendPage extends AccordionNetworkModule {
    constructor(page: Page) {
        super(page);
    }

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

class BridgePage extends DashboardPage {
    constructor(page: Page) {
        super(page);
    }
}

export { DashboardPage, SwapPage, SuperSwapPage, SendPage, BridgePage };
