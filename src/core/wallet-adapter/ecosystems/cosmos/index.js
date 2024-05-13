import { ref } from 'vue';
import _ from 'lodash';

import { cosmos, cosmwasm } from 'osmojs';

import { SigningStargateClient, StargateClient, GasPrice } from '@cosmjs/stargate';
import { Decimal } from '@cosmjs/math';

import { Logger, WalletManager } from '@cosmos-kit/core';
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';
// import { wallets as LeapWallets } from '@cosmos-kit/leap';

// * Utils
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { toUtf8 } from '@cosmjs/encoding';
import { fromEvent, takeUntil, Subject } from 'rxjs';

// * Configs
import { ECOSYSTEMS, cosmologyConfig } from '@/core/wallet-adapter/config';

import AdapterBase from '@/core/wallet-adapter/utils/AdapterBase';
import { getConfigsByEcosystems, getTokensConfigByChain, getCosmologyTokensConfig } from '@/modules/chain-configs/api';

// * Helpers
import { validateCosmosAddress } from '@/core/wallet-adapter/utils/validations';
import { reEncodeWithNewPrefix, isDifferentSlip44, isActiveChain, isDefaultChain } from '@/core/wallet-adapter/utils';
import { errorRegister } from '@/shared/utils/errors';

import logger from '@/shared/logger';

import { ignoreRPC } from '@/core/wallet-adapter/utils/ignore-rpc';
// import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

import { DP_CHAINS } from '@/core/balance-provider/models/enums';

// * Config for cosmos
const {
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
    ADDRESS_BY_NETWORK: 'adapter:addressByNetwork',
};

// * Helpers for localStorage
const connectedAccounts = () => JSON.parse(window?.localStorage?.getItem(STORAGE.ACCOUNTS)) || [];
const connectedWalletModule = () => window?.localStorage.getItem(STORAGE.WALLET) || null;
const addressByNetwork = () => JSON.parse(window?.localStorage.getItem(STORAGE.ADDRESS_BY_NETWORK)) || {};

export class CosmosAdapter extends AdapterBase {
    chainsFromStore = {};
    walletManager = null;

    STANDARD_SLIP_44 = 118;

    REFRESH_EVENT = 'refresh_connection';
    DEFAULT_CHAIN = 'cosmoshub';

    differentSlip44 = [];
    ibcAssetsByChain = {};

    constructor() {
        super();
    }

    isLocked() {
        return !this.getConnectedWallet();
    }

    async init(store) {
        // * Get chains
        // ========= Init Cosmos Chains =========
        const chains = await getConfigsByEcosystems(ECOSYSTEMS.COSMOS, { isCosmology: true });
        const activeChains = _.values(chains).filter(isActiveChain);
        const defaultChains = _.values(activeChains).filter(isDefaultChain);

        this.store = store;

        this.chainsFromStore = store?.state?.configs?.chains[ECOSYSTEMS.COSMOS] || {};

        const assets = await getCosmologyTokensConfig();

        await Promise.all(
            defaultChains.map(
                async ({ chain_name }) => (this.ibcAssetsByChain[chain_name] = await getTokensConfigByChain(chain_name, ECOSYSTEMS.COSMOS)),
            ),
        );

        this.differentSlip44 = activeChains.filter(({ slip44 }) => slip44 != this.STANDARD_SLIP_44);

        // ========= Init WalletManager =========

        this.unsubscribe = new Subject();

        // * Init WalletManager
        const [KEPLR_EXT] = KeplrWallets;

        const logger = new Logger('INFO');

        this.walletManager = new WalletManager(
            activeChains,
            [KEPLR_EXT],
            logger,
            'connect_only',
            true,
            false,
            assets,
            {},
            {},
            {},
            {},
            {
                callback: () => {
                    this.walletManager.onMounted();
                },
            },
        );

        for (const chainRecord of this.walletManager.chainRecords) {
            // * Set client options for stargate on chainRecord for each chain
            const stargateClientOptions = {
                aminoTypes,
                registry,
            };

            const { fees = { fee_tokens: {} } } = chainRecord.chain || {};
            const { fee_tokens = {} } = fees || {};

            const gasPrice = this.getGasPriceFromChain(chainRecord.assetList.assets, fee_tokens);

            stargateClientOptions.gasPrice = gasPrice;

            this.chainsFromStore[chainRecord.chain.chain_name] &&
                (chainRecord.chain.logo =
                    this.chainsFromStore[chainRecord.chain.chain_name]?.logo ||
                    chainRecord.chain.logo_URIs?.svg ||
                    chainRecord.chain.logo_URIs?.png);

            chainRecord.clientOptions.signingStargate = stargateClientOptions;
        }

        this.walletManager.onMounted();
    }

    getGasPriceFromChain(assets = [], feeTokens = []) {
        if (!feeTokens.length) return 0;

        const [feeInfo = {}] = feeTokens;

        const price = feeInfo.average_gas_price || feeInfo.low_gas_price || feeInfo.fixed_min_gas_price || feeInfo.high_gas_price;

        if (!price || !feeInfo.denom) return 0;

        const asset = assets.find((asset) => asset.base === feeInfo.denom);
        const decimals = asset?.denom_units[1]?.exponent || asset.decimals;

        try {
            const atomics = BigNumber(price).multipliedBy(BigNumber(10).pow(decimals)).toString();
            const Decimals = new Decimal(atomics, decimals);
            const gasPrice = new GasPrice(Decimals, asset.base);
            return gasPrice;
        } catch (error) {
            console.log('-'.repeat(10), 'GAS PRICE ERROR', '-'.repeat(10));
            console.log('asset', feeTokens[0].denom);
            console.log('Error while getting gas price', error);
            return 0;
        }
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

        if (!walletModule?.value) return;

        if (!this.walletManager) this.init();

        const listeners = this.walletManager.coreEmitter.listeners(this.REFRESH_EVENT);

        if (listeners.length > 0) return;

        return fromEvent(this.walletManager, this.REFRESH_EVENT, async () => {
            const chainWallet = this._getCurrentWallet();

            chainWallet?.value?.activate();

            await chainWallet?.value?.connect(false);
            await chainWallet?.value?.update({ connect: false });

            await this.setAddressForChains(chainWallet?.value?.walletName);
        }).pipe(takeUntil(this.unsubscribe));
    }

    unsubscribeFromWalletsChange() {
        console.log('Unsubscribe from wallets change', 'cosmos');
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    async updateStates() {
        const chainWallet = this._getCurrentWallet();
        await chainWallet?.value?.update({ connect: true });
    }

    _getCurrentWallet() {
        const accounts = connectedAccounts();

        const wallet = this.walletName || connectedWalletModule();

        if (!wallet || !accounts.length) return null;

        if (!this.currentChain) this.currentChain = this.DEFAULT_CHAIN;

        let chainRecord = this.walletManager.getChainRecord(this.currentChain);

        if (!chainRecord) {
            const account = accounts[0];

            chainRecord = this.walletManager.chainRecords.find(({ chain }) => chain.chain_id === account.chainId);

            if (!chainRecord) return null;
        }

        const chainWallet = ref(this.walletManager.getChainWallet(chainRecord.name, wallet));

        chainWallet.value?.emitter && chainWallet.value.emitter.setMaxListeners(100);

        return chainWallet;
    }

    checkClient(walletName) {
        const client = this.walletManager.getMainWallet(walletName);

        if (!client) return false;

        const { clientMutable } = client || {};

        if (clientMutable.message === 'Client Not Exist!') return false;

        if (clientMutable.state === 'Error') return false;

        return true;
    }

    async getSupportedEcosystemChains(chainRecords, chainWallet) {
        try {
            const enablePromises = chainRecords.map(async (chainRecord) => {
                await chainWallet?.client.enable(chainRecord.chain.chain_id);
            });

            await Promise.all(enablePromises);
        } catch (error) {
            logger.log('Error while approving chains', error);
        }
    }

    async connectWallet(walletName, chain = this.DEFAULT_CHAIN) {
        try {
            if (!this.walletManager) await this.init();
        } catch (error) {
            logger.error('[COSMOS -> connectWallet -> INIT WM]', error, this.walletManager?.isError);
            return false;
        }

        try {
            const chainWallet = this.walletManager.getChainWallet(chain, walletName);

            await this.getSupportedEcosystemChains(this.walletManager.chainRecords, chainWallet.client);

            // chainWallet.restEndpoints = [`${DEFAULT_REST}/${chain}`];
            // chainWallet.rpcEndpoints = [`${DEFAULT_RPC}/${chain}`];

            await chainWallet.initClient();
            await chainWallet.connect(true);

            const isConnected = chainWallet.isWalletConnected;

            if (!isConnected) return false;

            this.walletName = walletName;
            this.currentChain = chain;

            await this.setAddressForChains(walletName);
            await chainWallet.update({ connect: true });

            return {
                isConnected: isConnected,
                walletName: walletName,
            };
        } catch (error) {
            logger.error('[COSMOS -> connectWallet -> CONNECT]', error, this.walletManager?.isError);
            return false;
        }
    }

    async setChain(chainInfo) {
        const { walletModule, chain, chain_id } = chainInfo || {};

        const chainForConnect = chain || chain_id || this.DEFAULT_CHAIN;

        try {
            const connected = await this.connectWallet(walletModule, chainForConnect);
            return connected;
        } catch (error) {
            logger.error('Error in setChain', error);
            return false;
        }
    }

    async chainsWithDifferentSlip44(walletName) {
        try {
            const walletList = this.walletManager.walletRepos;
            const mainAccount = this.getAccount();

            if (!walletList) return null;

            const promises = walletList.map(async (wallet) => {
                if (!this.addressByNetwork[mainAccount]) this.addressByNetwork[mainAccount] = {};

                const { chainName } = wallet;

                if (!Object.values(DP_CHAINS).includes(chainName)) return;

                if (!isDifferentSlip44(chainName, this.differentSlip44)) return;

                const diffChain = wallet.getWallet(walletName);

                if (!diffChain) return;

                diffChain.activate();

                await diffChain.initClient();
                await diffChain.connect(false);

                const isConnected = diffChain.isWalletConnected;

                if (isConnected)
                    this.addressByNetwork[mainAccount][chainName] = {
                        address: diffChain.address,
                        logo: diffChain.chain.logo,
                    };

                localStorage.setItem(STORAGE.ADDRESS_BY_NETWORK, JSON.stringify(this.addressByNetwork[mainAccount]));
            });

            await Promise.all(promises);
        } catch (error) {
            logger.error('Error in chainsWithDifferentSlip44', error);
        }
    }

    async setAddressForChains(walletName) {
        if (!this.addressByNetwork) this.addressByNetwork = {};

        if (!walletName) walletName = this.walletName;

        const mainAccount = this.getAccount();

        const cosmosWallet = this.walletManager.getChainWallet(this.DEFAULT_CHAIN, walletName);

        cosmosWallet.activate();
        await cosmosWallet.connect(false);

        const mainAddress = cosmosWallet.address;

        if (!mainAddress) return null;

        if (!this.addressByNetwork[mainAccount]) this.addressByNetwork[mainAccount] = {};

        const promises = this.walletManager.chainRecords.map(async ({ chain }) => {
            const { bech32_prefix, chain_name } = chain;

            if (isDifferentSlip44(chain_name, this.differentSlip44)) return undefined;

            const chainAddress = await reEncodeWithNewPrefix(bech32_prefix, mainAddress);

            this.addressByNetwork[mainAccount][chain_name] = {
                address: chainAddress,
                logo: chain.logo,
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
        window.localStorage.removeItem(STORAGE.ADDRESS_BY_NETWORK);

        this.addressByNetwork = {};
    }

    async disconnectAllWallets() {
        const walletModule = this._getCurrentWallet();
        await walletModule?.value?.disconnect(true);
        await walletModule?.value?.update({ connect: false });

        window.localStorage.removeItem(STORAGE.WALLET);
        window.localStorage.removeItem(STORAGE.ACCOUNTS);
        window.localStorage.removeItem(STORAGE.ADDRESS_BY_NETWORK);
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

        if (!chain || !walletInfo || !assets.length) return null;

        const [asset] = assets;

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
            asset,
        };

        return currentChain;
    }

    getChainList() {
        const chainList = this.walletManager.chainRecords.map((record) => {
            const { chain, assetList = {} } = record || {};

            const { assets = [] } = assetList || {};

            const [asset = {}] = assets || [];

            asset.decimals = asset.denom_units[1].exponent;

            const [mainWallet] = this.walletManager.mainWallets || [];

            if (!this.walletName && mainWallet) this.walletName = mainWallet.walletName;

            const chainRecord = {
                ...chain,
                asset,
                ecosystem: ECOSYSTEMS.COSMOS,
                id: chain.chain_id,
                net: chain.chain_name,
                chain_id: chain.chain_name,
                name: chain.pretty_name,
                walletName: this.walletName,
                walletModule: this.walletName,
            };

            return chainRecord;
        });

        return _.values(chainList).filter(isDefaultChain);
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
            if (!chainWallet.value)
                return {
                    error: 'Chain wallet not found',
                };

            const [feeInfo = {}] = chainWallet.value.chainRecord.chain.fees.fee_tokens || [];

            // Check if feeInfo exist
            if (!feeInfo || JSON.stringify(feeInfo) === '{}')
                return {
                    error: 'Fee info not found',
                };

            const { denom = null, average_gas_price: amount = 0 } = feeInfo;

            // Check if denom and amount exist
            if (!denom || !amount)
                return {
                    error: 'Fee info not found',
                };

            // Fee for transaction
            fee.amount = [
                {
                    denom,
                    amount: amount.toString(),
                },
            ];

            return fee;
        } catch (error) {
            logger.error('error while getting fee', error);
            return errorRegister(error);
        }
    }

    // * Simulate transaction
    async simulateTxGas(client = SigningStargateClient, msg, { rpc }) {
        const GAS_ADJUSTMENT = 1.45;

        const msgs = Array.isArray(msg) ? msg : [msg];
        const [tx] = msgs || [];
        const typeUrl = tx?.typeUrl || '';

        try {
            const msgs = Array.isArray(msg) ? msg : [msg];

            const signerAccount = await client.signer?.getAccounts();

            const [account] = signerAccount || [];

            const simGas = await client.simulate(account.address, msgs);

            const adjustedGas = BigNumber(simGas).multipliedBy(GAS_ADJUSTMENT).toString();

            logger.log('Simulated gas |', simGas.toString(), `| multiplied to ${GAS_ADJUSTMENT} |`, adjustedGas);

            logger.log('-'.repeat(50), '\n\n');

            return adjustedGas;
        } catch (error) {
            logger.warn('[COSMOS -> getTransactionFee -> simulateTxGas]', error);
            logger.log('Trying to get gas from block', typeUrl);

            try {
                const stargateClient = await StargateClient.connect(rpc);

                // Get latest block
                const latestBlock = await stargateClient.getBlock();
                const { header } = latestBlock || {};
                const { height = 0 } = header || {};

                const query = `message.action='${typeUrl}' AND tx.height<=${height} AND tx.height>${height - 100}`;
                const txs = await stargateClient.searchTx(query);

                if (!txs || !txs.length) return null;

                const [transaction] = txs || [];
                console.log('transaction', transaction);

                return transaction?.gasWanted || transaction?.gasUsed || null;
            } catch (error) {
                logger.error('[COSMOS -> getTransactionFee -> searchInBlock gas from block]', error);
                return null;
            }
        }
    }

    async getTransactionFee(client, msg, { rpc }) {
        // SimulateTx to get gas for transaction
        logger.debug('[COSMOS -> getTransactionFee] SimulateTx to get gas for transaction');

        const gasToCoin = (gas) => {
            const { gasPrice } = client;
            const { amount = 0 } = gasPrice || {};
            const { atomics, fractionalDigits } = amount || {};

            const gasPriceAmount = BigNumber(atomics)
                .dividedBy(10 ** fractionalDigits)
                .toString();

            const decimalsBN = BigNumber(10).pow(fractionalDigits);

            return BigNumber(gas).multipliedBy(gasPriceAmount).dividedBy(decimalsBN).toString();
        };

        try {
            const simulatedGas = await this.simulateTxGas(client, msg, { rpc });
            console.log('gasToCoin', gasToCoin(simulatedGas));

            if (simulatedGas)
                return {
                    gas: simulatedGas,
                    gasToCoin: gasToCoin(simulatedGas),
                };
        } catch (error) {
            logger.warn('[COSMOS -> getTransactionFee -> simulateTxFee]', error);
        }

        logger.debug('[COSMOS -> getTransactionFee] SimulateTx not found, Use default fee');

        return null;
    }

    async prepareDelegateTransaction({ fromAddress, toAddress, amount, token, memo }) {
        const fee = this.setDefaultFeeForTx();

        console.log('prepareDelegateTransaction', fromAddress, toAddress, amount, token, memo);
        try {
            const { delegate } = cosmos.staking.v1beta1.MessageComposer.withTypeUrl;

            const amountFormatted = utils.parseUnits(amount, token.decimals).toString();

            const msg = delegate({
                amount: {
                    denom: token.base,
                    amount: amountFormatted,
                },
                delegatorAddress: fromAddress,
                validatorAddress: toAddress,
            });

            return {
                msg,
                fee,
                memo,
            };
        } catch (error) {
            logger.error('COSMOS -> prepareDelegateTransaction', error);
        }
    }

    async prepareMultipleExecuteMsgs({ fromAddress, amount, token, memo, count = 1, contract, funds = [], msgKey = 'mint' }) {
        const fee = this.setDefaultFeeForTx();
        const prepareMsgs = () => {
            try {
                const { executeContract } = cosmwasm.wasm.v1.MessageComposer.withTypeUrl;

                const jsonMsg = {
                    [msgKey]: {},
                };

                const contractMsg = toUtf8(JSON.stringify(jsonMsg));

                const msg = executeContract({
                    sender: this.getAccountAddress(),
                    contract,
                    funds,
                    msg: contractMsg,
                });

                return msg;
            } catch (error) {
                logger.error('error while prepare', error);
            }
        };

        const msgs = [];

        try {
            for (let i = 0; i < count; i++) {
                const msg = prepareMsgs();
                if (!msg) continue;
                msgs.push(msg);
            }

            return {
                msg: msgs,
                fee,
            };
        } catch (error) {
            logger.error('error while prepareMultipleExecute', error);
            return errorRegister(error);
        }
    }

    async prepareTransaction({ fromAddress, toAddress, amount, token, memo }) {
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
                memo,
            };
        } catch (error) {
            logger.error('error while prepare', error);
            return errorRegister(error);
        }
    }

    async formatTransactionForSign(transaction = {}, params = {}) {
        if (!transaction || JSON.stringify(transaction) === '{}')
            return {
                error: 'Transaction not found for sign',
            };

        const response = {
            msg: null,
            fee: this.setDefaultFeeForTx(),
        };

        // Additional params for transaction format
        const { tokens = {}, amount = 0 } = params || {};
        const { from = {} } = tokens || {};
        const { decimals: fromDecimals = 0, base: fromBase } = from || {};

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

                if (!newKey) continue;

                value[newKey] = value[key];

                delete value[key];
            }

            // add timeoutTimestamp to Msg if its object
            if (value?.timeoutTimestamp && typeof value.timeoutTimestamp === 'object') value.timeoutTimestamp = this._getTimeoutTimestamp();

            // remove timeoutHeight from Msg
            if (value?.timeoutHeight) delete value.timeoutHeight;

            // Custom actions for different types of transactions
            switch (typeUrl) {
                case '/cosmwasm.wasm.v1.MsgExecuteContract':
                    response.fee.gas = '1000000'; // Temporary gas by default for contract execution (1,000,000)

                    const { wasm, msg } = value || {};
                    const { contract: wasmContract, msg: wasmMsg, funds: wasmFunds } = wasm || {};

                    // * Add contract address to value if not exist
                    !value.contract && wasmContract && (value.contract = wasmContract);

                    // * Add sender address to value if not exist
                    !value.sender && (value.sender = this.getAccountAddress());

                    // !IMPORTANT: Add funds to value if not exist
                    if (!value.funds && wasmFunds) value.funds = wasmFunds;
                    else
                        !value.funds &&
                            (value.funds = [
                                {
                                    denom: fromBase,
                                    amount: BigNumber(amount)
                                        .multipliedBy(10 ** fromDecimals)
                                        .toString(),
                                },
                            ]);

                    // !IMPORTANT: Convert msg for sign
                    value.msg = toUtf8(JSON.stringify(msg || wasmMsg));

                    value.wasm && delete value.wasm; // Remove wasm from value

                    break;
            }

            response.msg = transaction;

            return response;
        } catch (error) {
            return errorRegister(error);
        }
    }

    async getSignClient(RPCs = [], { signingStargate = {}, offlineSigner = {} }) {
        const TIMEOUT_PROMISE = 3000; // 3 seconds for timeout

        // Check if RPCs exist
        if (!RPCs || !RPCs.length) {
            logger.warn('[COSMOS -> getSignClient] RPCs not found to get client');
            return null;
        }

        // Filter RPCs by ignoreRPC to avoid unnecessary connections
        const filteredRPCs = RPCs.filter((rpc) => !ignoreRPC(rpc));

        // Timeout promise for RPC
        const timeoutFN = (TIMEOUT = TIMEOUT_PROMISE, rpc) =>
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`TIMEOUT ${rpc}`)), TIMEOUT);
            });

        const connected = {
            rpc: null,
            client: null,
        };

        for (const rpc of filteredRPCs)
            try {
                const timeoutPromise = timeoutFN(TIMEOUT_PROMISE, rpc);
                const connectPromise = SigningStargateClient.connectWithSigner(rpc, offlineSigner, signingStargate);
                await Promise.race([timeoutPromise, connectPromise]);
                console.log('Client connected', rpc);
                connected.rpc = rpc;
                connected.client = await connectPromise;
                return connected;
                // Success
            } catch (error) {
                if (error?.message === `TIMEOUT ${rpc}`) {
                    logger.warn(`[COSMOS -> getSignClient TIMEOUT] Timeout connecting to RPC: ${rpc}`);
                    continue; // Try next RPC
                }

                logger.warn(`[COSMOS -> getSignClient] Error connecting to RPC: ${rpc}`, error.message);
                continue; // Try next RPC
            }

        return null;
    }

    async getSignClientByChain(chain) {
        const chainWallet = ref(this.walletManager.getChainWallet(chain, this.walletName));
        await chainWallet.value.initOfflineSigner('amino');

        const { rpcEndpoints, chainRecord } = chainWallet.value || {};
        const { clientOptions = {} } = chainRecord || {};
        const { signingStargate = {} } = clientOptions;

        return (
            (await this.getSignClient(rpcEndpoints, {
                signingStargate,
                offlineSigner: chainWallet.value.offlineSigner,
            })) || {}
        );
    }

    async signSend(transaction) {
        const { msg, fee, memo } = transaction;

        const chainWallet = this._getCurrentWallet();
        await chainWallet.value.initOfflineSigner('amino');

        const { rpcEndpoints, chainRecord } = chainWallet.value || {};
        const { clientOptions = {} } = chainRecord || {};
        const { signingStargate = {} } = clientOptions;

        const signClient = await this.getSignClient(rpcEndpoints, {
            signingStargate,
            offlineSigner: chainWallet.value.offlineSigner,
        });

        // Check if client exist
        if (!signClient || !signClient.client)
            return {
                error: 'Signing Stargate client not found',
            };

        // Try to get estimated fee
        try {
            const estimatedFee = await this.getTransactionFee(signClient.client, msg, { rpc: signClient.rpc });

            if (estimatedFee) fee.gas = estimatedFee.gas;

            if (estimatedFee?.amount) fee.amount = estimatedFee.amount;
        } catch (error) {
            logger.error('[COSMOS -> signSend -> estimate]', error);
        }

        const msgs = Array.isArray(msg) ? msg : [msg];

        // Check timer
        const txTimerID = this.store.getters['txManager/txTimerID'];

        if (!txTimerID)
            return {
                isCanceled: true,
            };

        this.store.dispatch('txManager/setTxTimerID', null);

        // Sign and send transaction
        try {
            const tx = [this.getAccountAddress(), msgs, fee];

            if (memo && memo !== undefined) tx.push(memo);

            const response = await signClient.client.signAndBroadcast(...tx);

            console.log('Sign and broadcast response', response);

            return response;
        } catch (error) {
            logger.error('[COSMOS -> signSend] Error while broadcasting transaction', error);
            return errorRegister(error);
        }
    }

    getExplorer(chainInfo) {
        const MAIN_EXPLORER = ['mintscan', 'MintScan'];

        if (!chainInfo) return null;

        const { explorers = [] } = chainInfo || {};

        const explorer = explorers.find(({ kind }) => MAIN_EXPLORER.includes(kind));

        return explorer || null;
    }

    getTxExplorerLink(txHash, chainInfo) {
        const explorer = this.getExplorer(chainInfo) || {};

        const { tx_page = null } = explorer || {};

        if (!tx_page) return null;

        return tx_page.replace('${txHash}', txHash);
    }

    getTokenExplorerLink(token, chainInfo) {
        const ibcRegex = new RegExp('IBC|ibc', 'g');

        const explorer = this.getExplorer(chainInfo) || {};

        const { url } = explorer || {};

        if (!url) return null;

        // * Check if token is not IBC and length < 10, then return url to base token
        if (!ibcRegex.test(token) && token.length < 10) return url;

        const ibcHashTable = this.ibcAssetsByChain[chainInfo?.chain_name] || {};

        if (!ibcHashTable[token] && ibcRegex.test(token)) return null;

        // * Check if token is IBC and exist in hashTable, then return url to wasm contract
        if (!ibcHashTable[token] && !ibcRegex.test(token)) return `${url}/wasm/contract/${token}`;

        const { traces = [] } = ibcHashTable[token] || {};

        const [trace] = traces;

        const { chain = {}, counterparty = {} } = trace || {};

        const { channel_id: srcChannel } = chain || {};
        const { channel_id: dstChannel, chain_name: dstChain } = counterparty || {};

        if (!srcChannel || !dstChannel || !dstChain) return null;

        // * Return url to relayer
        return `${url}/relayers/${srcChannel}/${dstChain}/${dstChannel}`;
    }

    async getAddressesWithChains() {
        const mainAccount = this.getAccount();

        if (!this.addressByNetwork) return addressByNetwork();

        await this.chainsWithDifferentSlip44(this.walletName);

        return this.addressByNetwork[mainAccount] || {};
    }

    getNativeTokenByChain(chain) {
        const chainInfo = this.walletManager.getChainRecord(chain);

        const { assetList = {} } = chainInfo || {};

        const { assets = [] } = assetList || {};

        const [asset] = assets;

        return asset;
    }

    _getTimeoutTimestamp() {
        const PACKET_LIFETIME_NANO = 3600 * 1_000_000_000; // 1 Hour

        const currentTimeNano = Math.floor(Date.now() * 1_000_000);

        return BigNumber(currentTimeNano).plus(PACKET_LIFETIME_NANO).toString();
    }
}

export default new CosmosAdapter();
