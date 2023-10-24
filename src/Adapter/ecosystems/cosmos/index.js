import { ref } from 'vue';

import { fromEvent } from 'rxjs';

import { cosmos } from 'juno-network';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
// import { wallets as LeapWallets } from '@cosmos-kit/leap';
import { utils } from 'ethers';

import { ECOSYSTEMS, cosmologyConfig } from '@/Adapter/config';

import AdapterBase from '@/Adapter/utils/AdapterBase';

import { validateCosmosAddress } from '@/Adapter/utils/validations';
import { reEncodeWithNewPrefix, isDifferentSlip44 } from '@/Adapter/utils';
import { checkErrors } from '@/helpers/checkErrors';

// * Configs
const DEFAULT_CHAIN = 'cosmoshub';
const { chains, assets, differentSlip44 } = cosmologyConfig;

const DEFAULT_RPC = 'https://rpc.cosmos.directory';
// const DEFAULT_REST = 'https://rest.cosmos.directory';

// * Constants for localStorage
const STORAGE = {
    WALLET: 'cosmos-kit@2:core//current-wallet',
    ACCOUNTS: 'cosmos-kit@2:core//accounts',
};

// * Constants for events
const REFRESH_EVENT = 'refresh_connection';

// * Helpers for localStorage
const connectedAccounts = () => JSON.parse(window?.localStorage?.getItem(STORAGE.ACCOUNTS)) || [];
const connectedWalletModule = () => window?.localStorage.getItem(STORAGE.WALLET) || null;

class CosmosAdapter extends AdapterBase {
    constructor() {
        super();

        // * Init WalletManager
        const [KEPLR_EXT] = KeplrWallets;

        const logger = new Logger('INFO');

        this.walletManager = new WalletManager(chains, assets, [KEPLR_EXT], logger);
        this.walletManager.onMounted();
    }

    getConnectedWallets() {
        for (const wallet of connectedAccounts()) {
            wallet.ecosystem = ECOSYSTEMS.COSMOS;
            delete wallet.namespace;
        }

        return connectedAccounts();
    }

    subscribeToWalletsChange() {
        const walletModule = this._getCurrentWallet();

        if (!walletModule?.value) {
            return;
        }

        const listeners = this.walletManager.coreEmitter.listeners(REFRESH_EVENT);

        if (listeners.length > 0) {
            return;
        }

        return fromEvent(this.walletManager, REFRESH_EVENT, async () => {
            const chainWallet = this._getCurrentWallet();

            chainWallet?.value?.activate();

            await chainWallet?.value?.connect(false);
            await chainWallet?.value?.update({ connect: false });

            await this.setAddressForChains(chainWallet?.value?.walletName);
        });
    }

    async updateStates() {
        const chainWallet = this._getCurrentWallet();
        await chainWallet?.value?.update({ connect: true });
    }

    _getCurrentWallet() {
        const accounts = connectedAccounts();

        const wallet = this.walletName || connectedWalletModule();

        if (!wallet || !accounts.length) {
            return null;
        }

        if (!this.currentChain) {
            this.currentChain = DEFAULT_CHAIN;
        }

        let chainRecord = this.walletManager.getChainRecord(this.currentChain);

        if (!chainRecord) {
            const account = accounts[0];

            chainRecord = this.walletManager.chainRecords.find(({ chain }) => chain.chain_id === account.chainId);

            if (!chainRecord) {
                return null;
            }
        }

        const chainWallet = ref(this.walletManager.getChainWallet(chainRecord.name, wallet));

        chainWallet.value?.emitter && chainWallet.value.emitter.setMaxListeners(100);

        return chainWallet;
    }

    checkClient(walletName) {
        const client = this.walletManager.getMainWallet(walletName);

        if (!client) {
            return false;
        }
        const { clientMutable } = client || {};

        if (clientMutable.message === 'Client Not Exist!') {
            return false;
        }

        if (clientMutable.state === 'Error') {
            return false;
        }

        return true;
    }

    async connectWallet(walletName, chain = DEFAULT_CHAIN) {
        try {
            const chainWallet = this.walletManager.getChainWallet(chain, walletName);

            chainWallet.activate();

            // chainWallet.restEndpoints = [`${DEFAULT_REST}/${chain}`];
            // chainWallet.rpcEndpoints = [`${DEFAULT_RPC}/${chain}`];

            await chainWallet.initClient();
            await chainWallet.connect(true);

            const isConnected = chainWallet.isWalletConnected;

            if (!isConnected) {
                return false;
            }

            this.walletName = walletName;
            this.currentChain = chain;

            await this.setAddressForChains(walletName);
            await chainWallet.update({ connect: true });

            return isConnected;
        } catch (error) {
            console.error(error, this.walletManager.isError);
            return false;
        }
    }

    async setChain(chainInfo) {
        const { walletName, chain, chain_id } = chainInfo;

        const chainForConnect = chain || chain_id || DEFAULT_CHAIN;

        try {
            const connected = await this.connectWallet(walletName, chainForConnect);
            return connected;
        } catch (error) {
            console.error('Error in setChain', error);
            return false;
        }
    }

    async chainsWithDifferentSlip44(walletName) {
        try {
            const walletList = this.walletManager.walletRepos;
            const mainAccount = this.getAccount();

            if (!walletList) {
                return null;
            }

            const promises = walletList.map(async (wallet) => {
                if (!this.addressByNetwork[mainAccount]) {
                    this.addressByNetwork[mainAccount] = {};
                }

                const { chainName } = wallet;

                if (!isDifferentSlip44(chainName, differentSlip44)) {
                    return;
                }

                const diffChain = wallet.getWallet(walletName);

                diffChain.activate();

                await diffChain.initClient();
                await diffChain.connect(false);

                const isConnected = diffChain.isWalletConnected;

                if (isConnected) {
                    this.addressByNetwork[mainAccount][chainName] = {
                        address: diffChain.address,
                        logo: diffChain.chain.logo_URIs?.svg || diffChain.chain.logo_URIs?.png || null,
                    };
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Error in chainsWithDifferentSlip44', error);
        }
    }

    async setAddressForChains(walletName) {
        if (!this.addressByNetwork) {
            this.addressByNetwork = {};
        }

        const mainAddress = this.getAccountAddress();
        const mainAccount = this.getAccount();

        if (!mainAddress) {
            return null;
        }

        if (!this.addressByNetwork[mainAccount]) {
            this.addressByNetwork[mainAccount] = {};
        }

        const promises = this.walletManager.chainRecords.map(async ({ chain }) => {
            const { bech32_prefix, chain_name } = chain;

            if (isDifferentSlip44(chain_name, differentSlip44)) {
                return undefined;
            }

            const chainAddress = await reEncodeWithNewPrefix(bech32_prefix, mainAddress);

            this.addressByNetwork[mainAccount][chain_name] = {
                address: chainAddress,
                logo: chain.logo_URIs?.svg || chain.logo_URIs?.png || null,
            };
        });

        await Promise.all(promises);

        await this.chainsWithDifferentSlip44(walletName);
    }

    getMainWallets() {
        return this.walletManager.mainWallets || [];
    }

    async disconnectWallet() {
        const walletModule = this._getCurrentWallet();
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });

        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);

        this.addressByNetwork = {};
    }

    async disconnectAllWallets() {
        const walletModule = this._getCurrentWallet();
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });

        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);
        this.addressByNetwork = {};
    }

    getWalletModule() {
        return connectedWalletModule() || null;
    }

    getAccount() {
        const walletModule = this._getCurrentWallet();
        return walletModule?.value?.username || null;
    }

    getAccountAddress() {
        const walletModule = this._getCurrentWallet();
        return walletModule?.value?.address || null;
    }

    getConnectedWallet() {
        const connectedWallet = {
            account: this.getAccount(),
            address: this.getAccountAddress(),
            walletModule: this.getWalletModule(),
            ecosystem: ECOSYSTEMS.COSMOS,
        };

        return connectedWallet || null;
    }

    getCurrentChain() {
        const walletModule = this._getCurrentWallet();

        const { chain, walletInfo, assets = [] } = walletModule?.value || {};

        if (!chain || !walletInfo || !assets.length) {
            return null;
        }

        const [asset] = assets;

        asset.logo = asset.logo_URIs?.svg || asset.logo_URIs?.png || null;
        asset.decimals = asset.denom_units[1].exponent;

        const currentChain = {
            ...chain,
            id: chain.chain_id,
            net: chain.chain_name,
            chain_id: chain.chain_name,
            name: chain.pretty_name,
            walletModule: walletInfo.name,
            walletName: walletInfo.prettyName,
            ecosystem: ECOSYSTEMS.COSMOS,
            bech32_prefix: chain.bech32_prefix,
            logo: chain.logo_URIs?.svg || chain.logo_URIs?.png || null,
            asset,
        };

        return currentChain;
    }

    getChainList() {
        const chainList = this.walletManager.chainRecords.map((record) => {
            const { chain, assetList = {} } = record || {};

            const { assets = [] } = assetList || {};

            const [asset = {}] = assets || [];

            asset.logo = asset.logo_URIs?.svg || asset.logo_URIs?.png || null;
            asset.decimals = asset.denom_units[1].exponent;

            const chainRecord = {
                ...chain,
                asset,
                ecosystem: ECOSYSTEMS.COSMOS,
                id: chain.chain_id,
                net: chain.chain_name,
                chain_id: chain.chain_name,
                name: chain.pretty_name,
                walletName: this.walletName,
                logo: chain.logo_URIs?.svg || chain.logo_URIs?.png || null,
            };

            return chainRecord;
        });

        return chainList;
    }

    getWalletLogo(walletModule) {
        const module = this.walletManager.mainWallets.find((wallet) => wallet.walletName === walletModule);
        return module?.walletInfo?.logo || null;
    }

    validateAddress(address, { chainId }) {
        const { chain } = this.walletManager.getChainRecord(chainId) || {};

        const { bech32_prefix } = chain || {};

        return validateCosmosAddress(address, bech32_prefix);
    }

    async prepareTransaction({ fromAddress, toAddress, amount, token }) {
        const chainWallet = this._getCurrentWallet();

        const [feeInfo = {}] = chainWallet.value.chainRecord.chain.fees.fee_tokens || [];

        try {
            const { send } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;
            const amountFormatted = utils.parseUnits(amount, token.decimals).toString();

            const msg = send({
                amount: [
                    {
                        denom: token.base,
                        amount: amountFormatted,
                    },
                ],
                toAddress,
                fromAddress,
            });

            const fee = {
                amount: [
                    {
                        denom: feeInfo.denom,
                        amount: feeInfo.average_gas_price.toString(),
                    },
                ],
                gas: '200000', // TODO: get from chain
            };

            console.log('-msg', msg);
            return {
                msg,
                fee,
            };
        } catch (error) {
            console.error('error while prepare', error);
            return checkErrors(error);
        }
    }

    async signSend(transaction) {
        const { msg, fee } = transaction;

        const chainWallet = this._getCurrentWallet();

        try {
            chainWallet.value.rpcEndpoints = [`${DEFAULT_RPC}/${chainWallet.value.chainName}`];

            const response = await chainWallet.value.signAndBroadcast([msg], fee);

            return response;
        } catch (error) {
            console.error('error while signAndSend', error);
            return checkErrors(error);
        }
    }

    getTxExplorerLink(txHash, chainInfo) {
        const MAIN_EXPLORER = 'mintscan';

        const explorer = chainInfo.explorers.find(({ kind }) => kind === MAIN_EXPLORER);

        const { tx_page } = explorer || {};

        return tx_page.replace('${txHash}', txHash);
    }

    getAddressesWithChains() {
        const mainAccount = this.getAccount();
        return this.addressByNetwork[mainAccount] || {};
    }
}

export default new CosmosAdapter();
