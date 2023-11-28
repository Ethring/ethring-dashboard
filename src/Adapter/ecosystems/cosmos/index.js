import { ref } from 'vue';

import { cosmos } from 'osmojs';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
// import { wallets as LeapWallets } from '@cosmos-kit/leap';

// * Utils
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { toUtf8 } from '@cosmjs/encoding';
import { fromEvent } from 'rxjs';

// * Configs
import { ECOSYSTEMS, cosmologyConfig } from '../../config';

import AdapterBase from '@/Adapter/utils/AdapterBase';

// * Helpers
import { validateCosmosAddress } from '@/Adapter/utils/validations';
import { reEncodeWithNewPrefix, isDifferentSlip44 } from '@/Adapter/utils';
import { checkErrors } from '@/helpers/checkErrors';

// * Config for cosmos
const {
    // Chains
    chains,
    differentSlip44,
    // Assets
    assets,
    ibcAssetsByChain,
    // Custom Registry for stargate
    aminoTypes,
    registry,
} = cosmologyConfig;

// const DEFAULT_RPC = 'https://rpc.cosmos.directory';
// const DEFAULT_REST = 'https://rest.cosmos.directory';

// * Constants for localStorage
const STORAGE = {
    WALLET: 'cosmos-kit@2:core//current-wallet',
    ACCOUNTS: 'cosmos-kit@2:core//accounts',
};

// * Helpers for localStorage
const connectedAccounts = () => JSON.parse(window?.localStorage?.getItem(STORAGE.ACCOUNTS)) || [];
const connectedWalletModule = () => window?.localStorage.getItem(STORAGE.WALLET) || null;

class CosmosAdapter extends AdapterBase {
    REFRESH_EVENT = 'refresh_connection';
    DEFAULT_CHAIN = 'cosmoshub';

    constructor() {
        super();

        // * Init WalletManager
        const [KEPLR_EXT] = KeplrWallets;

        const logger = new Logger('INFO');

        this.walletManager = new WalletManager(chains, assets, [KEPLR_EXT], logger);

        const stargateClientOptions = {
            aminoTypes,
            registry,
        };

        for (const chainRecord of this.walletManager.chainRecords) {
            const gasPrice = this.getGasPriceFromChain(chainRecord.chain.fees?.fee_tokens);

            gasPrice && (stargateClientOptions.gasPrice = gasPrice);

            chainRecord.clientOptions.signingStargate = stargateClientOptions;
        }

        this.walletManager.onMounted();
    }

    getGasPriceFromChain(feeTokens = []) {
        if (!feeTokens.length) {
            return 0;
        }

        const [feeInfo = {}] = feeTokens;

        const { fixed_min_gas_price, average_gas_price, low_gas_price, high_gas_price, denom } = feeInfo || {};

        const price = fixed_min_gas_price || low_gas_price || average_gas_price || high_gas_price;

        if (!price || !denom) {
            return 0;
        }

        return GasPrice.fromString(`${price}${denom}`);
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

        const listeners = this.walletManager.coreEmitter.listeners(this.REFRESH_EVENT);

        if (listeners.length > 0) {
            return;
        }

        return fromEvent(this.walletManager, this.REFRESH_EVENT, async () => {
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
            this.currentChain = this.DEFAULT_CHAIN;
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

    async connectWallet(walletName, chain = this.DEFAULT_CHAIN) {
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

            return {
                isConnected: isConnected,
                walletName: walletName,
            };
        } catch (error) {
            console.error(error, this.walletManager.isError);
            return false;
        }
    }

    async setChain(chainInfo) {
        const { walletName, chain, chain_id } = chainInfo;

        const chainForConnect = chain || chain_id || this.DEFAULT_CHAIN;

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

        if (!walletName) {
            walletName = this.walletName;
        }

        const mainAccount = this.getAccount();

        const cosmosWallet = this.walletManager.getChainWallet(this.DEFAULT_CHAIN, walletName);

        cosmosWallet.activate();
        await cosmosWallet.connect(false);

        const mainAddress = cosmosWallet.address;

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

    // * Set default fee for transaction
    setDefaultFeeForTx() {
        const fee = {
            amount: [],
            gas: '500000', // TODO: Temp solution, FIX: [Get from chain | calculate | get from response]
        };

        // * Getting fee
        try {
            const chainWallet = this._getCurrentWallet();

            // Check if chainWallet exist
            if (!chainWallet.value) {
                return {
                    error: 'Chain wallet not found',
                };
            }

            const [feeInfo = {}] = chainWallet.value.chainRecord.chain.fees.fee_tokens || [];

            // Check if feeInfo exist
            if (!feeInfo || JSON.stringify(feeInfo) === '{}') {
                return {
                    error: 'Fee info not found',
                };
            }

            const { denom = null, average_gas_price: amount = 0 } = feeInfo;

            // Check if denom and amount exist
            if (!denom || !amount) {
                return {
                    error: 'Fee info not found',
                };
            }

            // Fee for transaction
            fee.amount = [
                {
                    denom,
                    amount: amount.toString(),
                },
            ];

            return fee;
        } catch (error) {
            console.error('error while getting fee', error);
            return checkErrors(error);
        }
    }

    // * Simulate transaction
    async simulateTxGas(client = SigningStargateClient, msg) {
        const GAS_ADJUSTMENT = 1.4;

        try {
            const simGas = await client.simulate(this.getAccountAddress(), [msg]);

            if (!simGas) {
                return null;
            }

            const adjustedGas = BigNumber(simGas).multipliedBy(GAS_ADJUSTMENT).toString();

            console.log('Simulated gas |', simGas.toString(), `| multiplied to ${GAS_ADJUSTMENT} |`, adjustedGas);

            return adjustedGas;
        } catch (error) {
            console.error('error while simulate', error);
            return null;
        }
    }

    async estimateFeeTx(msg) {
        const chainWallet = this._getCurrentWallet();

        try {
            const estimatedFee = await chainWallet.value.estimateFee([msg]);

            if (estimatedFee) {
                return estimatedFee;
            }
        } catch (error) {
            console.error('[COSMOS -> getTransactionFee -> estimateFee]', error);
        }
    }

    async getTransactionFee(client, msg) {
        // SimulateTx to get gas for transaction
        try {
            const simulatedGas = await this.simulateTxGas(client, msg);

            if (simulatedGas) {
                return {
                    gas: simulatedGas,
                };
            }
        } catch (error) {
            console.warn('[COSMOS -> getTransactionFee -> simulateTxFee]', error);
        }

        // EstimateFee to get gas for transaction
        try {
            const estimatedFee = await this.estimateFeeTx(msg);

            if (estimatedFee) {
                return estimatedFee;
            }
        } catch (error) {
            console.warn('[COSMOS -> getTransactionFee -> estimateFee]', error);
        }

        console.warn('[COSMOS -> getTransactionFee] Fee not found, Use default fee');

        return null;
    }

    async prepareTransaction({ fromAddress, toAddress, amount, token }) {
        const fee = this.setDefaultFeeForTx();

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

            return {
                msg,
                fee,
            };
        } catch (error) {
            console.error('error while prepare', error);
            return checkErrors(error);
        }
    }

    async formatTransactionForSign(transaction = {}) {
        if (!transaction || JSON.stringify(transaction) === '{}') {
            return {
                error: 'Transaction not found for sign',
            };
        }

        const response = {
            msg: null,
            fee: this.setDefaultFeeForTx(),
        };

        // * Format transaction keys to camelCase
        try {
            const { value = {}, typeUrl = '' } = transaction || {};

            const CONVERT_TO_CAMEL = {
                timeout_height: 'timeoutHeight',
                timeout_timestamp: 'timeoutTimestamp',
                source_port: 'sourcePort',
                source_channel: 'sourceChannel',
            };

            for (const key in value) {
                const newKey = CONVERT_TO_CAMEL[key];

                if (!newKey) {
                    continue;
                }

                value[newKey] = value[key];

                delete value[key];
            }

            // remove timeoutHeight from Msg
            if (value?.timeoutHeight) {
                delete value.timeoutHeight;
            }

            // Custom fee for ExecuteContract
            if (typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract') {
                value.msg = toUtf8(JSON.stringify(value.msg)); // Convert msg to string and then to utf8 for sign
                response.fee.gas = '1000000'; // Temporary gas by default for contract execution
            }

            response.msg = transaction;

            return response;
        } catch (error) {
            return checkErrors(error);
        }
    }

    async getSignClient(RPCs, { signingStargate = {}, offlineSigner = {} }) {
        // Check if RPCs exist
        if (!RPCs.length) {
            console.warn('[COSMOS -> getSignClient] RPCs not found to get client');
            return null;
        }

        for (const rpc of RPCs) {
            try {
                return await SigningStargateClient.connectWithSigner(rpc, offlineSigner, signingStargate);
            } catch (error) {
                console.warn(`[COSMOS -> getSignClient] Error connecting to RPC: ${rpc}`, error.message);
            }
        }

        console.warn('[COSMOS -> getSignClient] Client not found');

        return null;
    }

    async signSend(transaction) {
        const { msg, fee } = transaction;

        const chainWallet = this._getCurrentWallet();
        await chainWallet.value.initOfflineSigner('amino');

        const { rpcEndpoints, chainRecord } = chainWallet.value || {};
        const { clientOptions = {} } = chainRecord || {};
        const { signingStargate = {} } = clientOptions;

        const client = await this.getSignClient(rpcEndpoints, {
            signingStargate,
            offlineSigner: chainWallet.value.offlineSigner,
        });

        // Check if client exist
        if (!client) {
            return {
                error: 'Signing Stargate client not found',
            };
        }

        // Try to get estimated fee
        try {
            const estimatedFee = await this.getTransactionFee(client, msg);

            if (estimatedFee) {
                fee.gas = estimatedFee.gas;
            }

            if (estimatedFee?.amount) {
                fee.amount = estimatedFee.amount;
            }
        } catch (error) {
            console.error('[COSMOS -> signSend -> estimate]', error);
        }

        // Sign and send transaction
        try {
            return await client.signAndBroadcast(this.getAccountAddress(), [msg], fee, transaction.value?.memo);
        } catch (error) {
            console.error('[COSMOS -> signSend] Error while broadcasting transaction', error);
            return checkErrors(error);
        }
    }

    getExplorer(chainInfo) {
        const MAIN_EXPLORER = ['mintscan', 'MintScan'];

        if (!chainInfo) {
            return null;
        }

        const { explorers = [] } = chainInfo || {};

        const explorer = explorers.find(({ kind }) => MAIN_EXPLORER.includes(kind));

        return explorer || null;
    }

    getTxExplorerLink(txHash, chainInfo) {
        const explorer = this.getExplorer(chainInfo) || {};

        const { tx_page = null } = explorer || {};

        if (!tx_page) {
            return null;
        }

        return tx_page.replace('${txHash}', txHash);
    }

    getTokenExplorerLink(token, chainInfo) {
        const ibcRegex = new RegExp('IBC|ibc', 'g');

        const explorer = this.getExplorer(chainInfo) || {};

        const { url } = explorer || {};

        if (!url) {
            return null;
        }

        // * Check if token is not IBC and length < 10, then return url to base token
        if (!ibcRegex.test(token) && token.length < 10) {
            return url;
        }

        const ibcHashTable = this.getIBCAssetsHashTable(chainInfo?.chain_name);

        // * Check if token is IBC and exist in hashTable, then return url to wasm contract
        if (!ibcHashTable[token]) {
            return `${url}/wasm/contract/${token}`;
        }

        const { traces = [] } = ibcHashTable[token] || {};

        const [trace] = traces;

        const { chain = {}, counterparty = {} } = trace || {};

        const { channel_id: srcChannel } = chain || {};
        const { channel_id: dstChannel, chain_name: dstChain } = counterparty || {};

        if (!srcChannel || !dstChannel || !dstChain) {
            return null;
        }

        // * Return url to relayer
        return `${url}/relayers/${srcChannel}/${dstChain}/${dstChannel}`;
    }

    getAddressesWithChains() {
        const mainAccount = this.getAccount();
        return this.addressByNetwork[mainAccount] || {};
    }

    getNativeTokenByChain(chain) {
        const chainInfo = this.walletManager.getChainRecord(chain);

        const { assetList = {} } = chainInfo || {};

        const { assets = [] } = assetList || {};

        const [asset] = assets;

        return asset;
    }

    getIBCAssets(chain) {
        return ibcAssetsByChain[chain] || [];
    }

    getIBCAssetsHashTable(chain) {
        const assets = this.getIBCAssets(chain);

        const hashTable = {};

        for (const asset of assets) {
            hashTable[asset.address] = asset;
        }

        return hashTable;
    }
}

export default new CosmosAdapter();
