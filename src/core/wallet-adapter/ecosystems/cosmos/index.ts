import { values as lodashValues } from 'lodash';
import { ref } from 'vue';
import { Store } from 'vuex';
import { values, orderBy } from 'lodash';

// * Cosmos SDK
import { cosmos, cosmwasm } from 'osmojs';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { OfflineSigner } from '@cosmjs/proto-signing';

// * Cosmos-kit (Cosmology sdk)
import { ChainRecord, Logger, WalletManager, WalletRepo } from '@cosmos-kit/core';
import type { Asset, AssetList, Chain } from '@chain-registry/types';

// * Cosmos-kit (Wallet)
import { wallets as KeplrWallets } from '@cosmos-kit/keplr';

// * Utils
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { toUtf8 } from '@cosmjs/encoding';
import { fromEvent, takeUntil, Subject } from 'rxjs';

// * Configs
import { cosmologyConfig } from '@/core/wallet-adapter/config';
import { DP_CHAINS } from '@/core/balance-provider/models/enums';
import { Ecosystem, Ecosystems } from '@/shared/models/enums/ecosystems.enum';

import { getConfigsByEcosystems, getTokensConfigByChain, getCosmologyTokensConfig } from '@/modules/chain-configs/api';

// * Utils
import logger from '@/shared/logger';
import { validateCosmosAddress } from '@/core/wallet-adapter/utils/validations';
import { reEncodeWithNewPrefix, isDifferentSlip44, isActiveChain, isDefaultChain } from '@/core/wallet-adapter/utils';
import { errorRegister } from '@/shared/utils/errors';
import { ignoreRPC } from '@/core/wallet-adapter/utils/ignore-rpc';

// * Types & Interfaces
import { ICosmosAdapter, IAddressByNetwork, ICosmosFeeTokens, IChainInfo } from '@/core/wallet-adapter/models/ecosystem-adapter';
import { IPrepareMultipleExecuteCosmos, IPrepareTxCosmos } from '@/core/wallet-adapter/models/ecosystem-transactions';
import { IConnectedWallet } from '@/shared/models/types/Account';

/**
 * * Interfaces
 */
interface IChain extends Chain {
    logo?: string;
}

interface IAsset extends Asset {
    decimals: number;
}

interface IAssetList extends AssetList {
    assets: IAsset[];
}

interface IChainRecord extends ChainRecord {
    chain: IChain;
    assetList: IAssetList;
    logo?: string;
}

// ****************************************************
// * Config for cosmos
// ****************************************************
const {
    aminoTypes, // Custom types for amino
    registry, // Custom registry for stargate
} = cosmologyConfig;

// ****************************************************
// * Constants for localStorage
// ****************************************************
const STORAGE = {
    WALLET: 'cosmos-kit@2:core//current-wallet',
    ACCOUNTS: 'cosmos-kit@2:core//accounts',
    ADDRESS_BY_NETWORK: 'adapter:addressByNetwork',
};

// * Helpers for localStorage
const getFromLocalStorage = (key: string, defaultVal: string = '{}') => {
    if (defaultVal === 'null') return window?.localStorage?.getItem(key) || null;
    return JSON.parse(window?.localStorage?.getItem(key) || defaultVal);
};
const connectedAccounts = () => getFromLocalStorage(STORAGE.ACCOUNTS, '[]');
const connectedWalletModule = () => getFromLocalStorage(STORAGE.WALLET, 'null');
const addressByNetwork = () => getFromLocalStorage(STORAGE.ADDRESS_BY_NETWORK, '{}');

// *****************************************************************
// * Adapter implementation
// *****************************************************************

/**
 * Represents the Cosmos adapter for interacting with the Cosmos ecosystem.
 * @implements {ICosmosAdapter}
 * @class CosmosAdapter
 * @singleton CosmosAdapter
 * @classdesc Adapter for interacting with the Cosmos ecosystem.
 * @export default CosmosAdapter - The Cosmos adapter class.
 */
export class CosmosAdapter implements ICosmosAdapter {
    // * Singleton instance
    private static instance: CosmosAdapter | null = null;

    // ****************************************************
    // * Adapter properties
    // ****************************************************
    store: any | Store<any>;
    walletManager: WalletManager | undefined;
    addressByNetwork: { [key: string]: IAddressByNetwork } = {};

    // ****************************************************
    // * Constants
    // ****************************************************
    STANDARD_SLIP_44: number = 118;
    REFRESH_EVENT: string = 'refresh_connection';
    DEFAULT_CHAIN: string = 'cosmoshub';
    DEFAULT_NAME_SERVICE: string = 'icns';

    // ****************************************************
    // * Properties
    // ****************************************************
    walletName: string | null = null; // Current wallet name
    currentChain: string | null = null;
    chainsFromStore: { [key: string]: any } = {};

    differentSlip44: IChain[] = [];
    ibcAssetsByChain: { [key: string]: any } = {};
    unsubscribe: Subject<any> | null = null;

    private constructor() {
        this.store = null;
        this.walletManager = undefined;
    }

    public static getInstance(): CosmosAdapter {
        if (!CosmosAdapter.instance) CosmosAdapter.instance = new CosmosAdapter();
        return CosmosAdapter.instance;
    }

    // ****************************************************
    // * Public methods
    // ****************************************************

    isLocked() {
        return !this.getConnectedWallet();
    }

    async init(store?: any) {
        store && (this.store = store);

        const lastUpdated = store?.state?.configs?.lastUpdated || null;

        // * Get chains

        // ========= Init Cosmos Chains =========
        const [chains, assets] = await Promise.all([
            getConfigsByEcosystems(Ecosystem.COSMOS, { isCosmology: true, lastUpdated }),
            getCosmologyTokensConfig({ lastUpdated }),
        ]);

        const activeChains = values(chains).filter(isActiveChain);
        const defaultChains = values(activeChains).filter(isDefaultChain);

        this.differentSlip44 = activeChains.filter(({ slip44 }) => slip44 != this.STANDARD_SLIP_44);
        this.chainsFromStore = this.store.state?.configs?.chains[Ecosystem.COSMOS] || {};

        await Promise.all(
            defaultChains.map(
                (c) => (this.ibcAssetsByChain[c.chain_name] = getTokensConfigByChain(c.chain_name, Ecosystem.COSMOS, { lastUpdated })),
            ),
        );

        // ========= Init WalletManager =========

        this.unsubscribe = new Subject();

        // * Init WalletManager
        const [KEPLR_EXT] = KeplrWallets;

        this.walletManager = new WalletManager(
            activeChains,
            [KEPLR_EXT],
            new Logger('INFO'),
            'connect_only',
            true,
            false,
            assets,
            this.DEFAULT_NAME_SERVICE,
            undefined,
            {
                signingStargate: this.getStargateClientOptionsForChains(activeChains),
            },
            undefined,
            {
                duration: 24 * 60 * 60 * 1000, // 24 hours
                callback: () => {
                    if (this.walletManager) this.walletManager.onMounted();
                    logger.warn('[COSMOS] WalletManager not found');
                },
            },
        );

        // * Set chain logos after wallet manager init
        this.setChainLogos();

        this.walletManager.onMounted();
    }

    getConnectedWallets() {
        for (const wallet of connectedAccounts()) {
            wallet.ecosystem = Ecosystem.COSMOS;
            delete wallet.namespace;
        }

        return connectedAccounts();
    }

    subscribeToWalletsChange() {
        const walletModule = this._getCurrentWallet();

        if (!walletModule?.value) return;

        if (!this.walletManager) this.init();

        if (!this.walletManager) return;

        const listeners = this.walletManager.coreEmitter.listeners(this.REFRESH_EVENT);

        if (listeners.length > 0) return;

        return fromEvent(this.walletManager, this.REFRESH_EVENT, async () => {
            const chainWallet = this._getCurrentWallet();

            chainWallet?.value?.activate();

            await chainWallet?.value?.connect(false);
            await chainWallet?.value?.update({ connect: false });

            await this.setAddressForChains(chainWallet?.value?.walletName as string);
        }).pipe(takeUntil(this.unsubscribe as any));
    }

    unsubscribeFromWalletsChange() {
        if (!this.unsubscribe) return;
        console.log('Unsubscribe from wallets change', 'cosmos');
        this.unsubscribe?.next(undefined);
        this.unsubscribe?.complete();
    }

    async updateStates(): Promise<void> {
        const chainWallet = this._getCurrentWallet();
        await chainWallet?.value?.update({ connect: true });
    }

    private _getCurrentWallet() {
        const getChainRecordByChainId = (chainId: string) => {
            if (!chainId) return null;
            if (!this.walletManager) return null;

            return this.walletManager.chainRecords.find(({ chain }) => {
                const { chain_id } = chain || {};
                return chain_id === chainId;
            });
        };

        const accounts = connectedAccounts();
        const [account] = accounts || [];
        const wallet = this.walletName || connectedWalletModule();

        if (!wallet || !accounts.length) return ref(null);
        if (!this.walletManager) return ref(null);
        if (!this.currentChain) this.currentChain = this.DEFAULT_CHAIN;

        const chainRecord = this.walletManager.getChainRecord(this.currentChain) || getChainRecordByChainId(account.chainId);
        const chainWallet = ref(this.walletManager.getChainWallet(chainRecord.name, wallet));
        chainWallet.value?.emitter && chainWallet.value.emitter.setMaxListeners(100);

        return chainWallet;
    }

    checkClient(walletName: string) {
        const ERROR_MSG = ['Client Not Exist!'];
        const ERROR_STATE = ['Error'];

        if (!this.walletManager) return false;
        if (!this.walletManager.mainWallets) return false;
        if (!this.walletManager.getMainWallet(walletName)) return false;

        const client = this.walletManager.getMainWallet(walletName);
        const { clientMutable } = client || {};

        if (clientMutable.message && ERROR_MSG.includes(clientMutable.message)) return false;
        if (clientMutable.state && ERROR_STATE.includes(clientMutable.state)) return false;

        return true;
    }

    async getSupportedEcosystemChains(chainRecords: IChainRecord[], chainWallet: any) {
        try {
            await Promise.all(chainRecords.map(async (chainRecord: any) => await chainWallet?.client?.enable(chainRecord.chain.chain_id)));
        } catch (error) {
            logger.log('Error while approving chains', error);
        }
    }

    // ****************************************************
    // * Wallet Connection & Disconnection
    // ****************************************************

    async connectWallet(walletName: string, chain = this.DEFAULT_CHAIN): Promise<{ isConnected: boolean; walletName: string }> {
        try {
            if (!this.walletManager) await this.init();
        } catch (error) {
            logger.error('[COSMOS -> connectWallet -> INIT WM]', error, this.walletManager?.isError);
            return {
                isConnected: false,
                walletName: walletName,
            };
        }

        if (!this.walletManager) {
            logger.error('[COSMOS -> connectWallet -> WalletManager NOT FOUND]');
            return {
                isConnected: false,
                walletName: walletName,
            };
        }

        try {
            const chainWallet = this.walletManager.getChainWallet(chain, walletName);

            await this.getSupportedEcosystemChains(this.walletManager.chainRecords as IChainRecord[], chainWallet.client);

            await chainWallet.initClient();
            await chainWallet.connect(true);

            if (!chainWallet.isWalletConnected)
                return {
                    isConnected: chainWallet.isWalletConnected,
                    walletName: walletName,
                };

            this.walletName = walletName;
            this.currentChain = chain;

            await this.setAddressForChains(walletName);
            await chainWallet.update({ connect: true });

            return {
                isConnected: chainWallet.isWalletConnected,
                walletName: walletName,
            };
        } catch (error) {
            logger.error('[COSMOS -> connectWallet -> CONNECT]', error, this.walletManager?.isError);
            return {
                isConnected: false,
                walletName: walletName,
            };
        }
    }

    async setChain(chainInfo: IChainInfo) {
        const { walletModule, chain, chain_id } = chainInfo || {};

        const chainForConnect = chain || chain_id || this.DEFAULT_CHAIN;

        try {
            if (!walletModule) return false;
            const { isConnected } = await this.connectWallet(walletModule, `${chainForConnect}`);
            return isConnected;
        } catch (error) {
            logger.error('Error in setChain', error);
            return false;
        }
    }

    async chainsWithDifferentSlip44(walletName: string) {
        try {
            if (!this.walletManager) return;

            const walletList: WalletRepo[] = this.walletManager.walletRepos;
            const mainAccount = this.getAccount();

            if (!walletList) return null;

            const promises = walletList.map(async (wallet: WalletRepo) => {
                if (!mainAccount) return;

                !this.addressByNetwork && (this.addressByNetwork = {});
                !this.addressByNetwork[mainAccount] && (this.addressByNetwork[mainAccount] = {});

                const { chainName } = wallet;

                if (!Object.values(DP_CHAINS).includes(chainName as any)) return;
                if (!isDifferentSlip44(chainName, this.differentSlip44)) return;

                const diffChain = wallet.getWallet(walletName) as any;

                if (!diffChain) return;

                diffChain.activate();
                await diffChain.initClient();
                await diffChain.connect(false);

                if (diffChain.isWalletConnected)
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

    async setAddressForChains(walletName: string | null): Promise<void> {
        if (!this.walletManager) return;
        if (!walletName) walletName = this.walletName;

        const mainAccount = this.getAccount();
        const cosmosWallet = this.walletManager.getChainWallet(this.DEFAULT_CHAIN, walletName as string);

        cosmosWallet.activate(); // * Activate wallet
        await cosmosWallet.connect(false); // * Connect wallet to get address
        const mainAddress = cosmosWallet.address; // * Get address

        // !IMPORTANT: If address or account not found, return
        if (!mainAccount || !mainAddress) return;

        // !IMPORTANT: If addressByNetwork for mainAccount not found, create new object
        !this.addressByNetwork && (this.addressByNetwork = {});
        !this.addressByNetwork[mainAccount] && (this.addressByNetwork[mainAccount] = {});

        const promises = this.walletManager.chainRecords.map((cr) => {
            const { chain } = cr as IChainRecord;
            const { bech32_prefix, chain_name } = chain as IChain;

            // !IMPORTANT: If chain_name is not default chain, return
            if (isDifferentSlip44(chain_name, this.differentSlip44)) return undefined;

            const chainAddress = reEncodeWithNewPrefix(bech32_prefix, mainAddress);
            this.addressByNetwork[mainAccount][chain_name] = {
                address: chainAddress,
                logo: chain?.logo || null,
            };
        });

        await Promise.all(promises);
        await this.chainsWithDifferentSlip44(walletName as string);
    }

    getMainWallets() {
        if (!this.walletManager) return [];
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

    getDefaultWalletAddress(): string | null {
        if (!this.walletManager) return null;
        if (!this.walletName) return null;
        if (!this.getAccount()) return null;
        if (!this.addressByNetwork[this.getAccount() as string]) return null;

        const chainWithAddress = this.addressByNetwork[this.getAccount() as string][this.DEFAULT_CHAIN];
        if (!chainWithAddress) return null;

        return chainWithAddress.address;
    }

    getAccountAddress() {
        const walletModule = this._getCurrentWallet();
        return walletModule?.value?.address || null;
    }

    getConnectedWallet() {
        const connectedWallet = {
            account: this.getAccount(),
            address: this.getAccountAddress(),
            walletName: this.getWalletModule(),
            walletModule: this.getWalletModule(),
            ecosystem: Ecosystem.COSMOS,
        };

        return connectedWallet || null;
    }

    getCurrentChain() {
        const walletModule = this._getCurrentWallet();

        const { chain, walletInfo, assets = [] } = walletModule?.value || {};

        if (!chain || !walletInfo || !assets.length) return null;

        return {
            ...chain,
            id: chain.chain_id,
            net: chain.chain_name,
            chain_id: chain.chain_name,
            name: chain.pretty_name,
            walletModule: walletInfo.name,
            walletName: walletInfo.prettyName,
            ecosystem: Ecosystem.COSMOS,
            bech32_prefix: chain.bech32_prefix,
            asset: this.getNativeTokenByChain(chain.chain_name),
        };
    }

    getChainList(allChains: boolean = false): IChainInfo[] {
        if (!this.walletManager) return [];
        const chainList = this.walletManager?.chainRecords.map((record) => {
            const { chain } = record as IChainRecord;

            if (!chain) return null;
            if (!this.walletManager) return null;

            const [mainWallet] = this.walletManager.mainWallets || [];
            if (!this.walletName && mainWallet) this.walletName = mainWallet.walletName;

            const asset = this.getNativeTokenByChain(chain.chain_name);

            const chainRecord = {
                ...chain,
                asset,
                ecosystem: Ecosystem.COSMOS,
                id: chain.chain_id,
                net: chain.chain_name,
                chain_id: chain.chain_name,
                name: chain.pretty_name,
                walletName: this.walletName,
                walletModule: this.walletName,
                logo: chain?.logo,
                coingecko_id: asset?.coingecko_id || null,
                isSupportedChain: isDefaultChain(chain as any),
            } as unknown as IChainInfo;

            return chainRecord;
        });

        if (!chainList.length) return [];

        if (!allChains) return chainList.filter((chain) => isDefaultChain(chain as any)) as IChainInfo[];

        return orderBy(values(chainList), [(elem: IChainInfo) => elem.isSupportedChain], ['desc']) as IChainInfo[];
    }

    async getWalletLogo(walletModule: string): Promise<string | null> {
        if (!this.walletManager) return null;
        const module = this.walletManager.mainWallets.find((wallet) => wallet.walletName === walletModule);
        const { logo } = module?.walletInfo || {};
        return logo as string;
    }

    validateAddress(address: string, { chainId }: any) {
        if (!chainId) return false;
        if (!this.walletManager) return false;

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
            if (!chainWallet || !chainWallet.value)
                return {
                    error: 'Chain wallet not found',
                };

            const { chainRecord } = chainWallet.value;
            const { chain } = chainRecord;

            if (!chain) return errorRegister('Chain not found');

            const { fees } = chain;

            if (!fees || JSON.stringify(fees) === '{}')
                return {
                    error: 'Fees not found',
                };

            const [feeInfo] = fees.fee_tokens || [];

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
            ] as any;

            return fee;
        } catch (error) {
            logger.error('error while getting fee', error);
            return errorRegister(error);
        }
    }

    // * Simulate transaction
    async simulateTxGas(client: SigningStargateClient, msg: any) {
        const GAS_ADJUSTMENT = 1.6;

        try {
            const msgs = Array.isArray(msg) ? msg : [msg];

            const simGas = await client.simulate(this.getAccountAddress() as string, msgs, undefined);

            if (!simGas) return null;

            const adjustedGas = BigNumber(simGas).multipliedBy(GAS_ADJUSTMENT).toString();

            logger.log('Simulated gas |', simGas.toString(), `| multiplied to ${GAS_ADJUSTMENT} |`, adjustedGas);

            logger.log('-'.repeat(50), '\n\n');

            return adjustedGas;
        } catch (error) {
            logger.error('[COSMOS -> getTransactionFee -> simulateTxGas]', error);
            return null;
        }
    }

    async estimateFeeTx(msg: any) {
        const chainWallet = this._getCurrentWallet();

        if (!chainWallet || !chainWallet.value) return errorRegister('Chain wallet not found');

        try {
            const msgs = Array.isArray(msg) ? msg : [msg];
            const estimatedFee = await chainWallet.value.estimateFee(msgs);

            if (estimatedFee) return estimatedFee;
        } catch (error) {
            logger.error('[COSMOS -> getTransactionFee -> estimateFee]', error);
        }
    }

    async getTransactionFee(client: any, msg: any) {
        // SimulateTx to get gas for transaction
        logger.debug('[COSMOS -> getTransactionFee] SimulateTx to get gas for transaction');
        try {
            const simulatedGas = await this.simulateTxGas(client, msg);

            if (simulatedGas)
                return {
                    gas: simulatedGas,
                };
        } catch (error) {
            logger.warn('[COSMOS -> getTransactionFee -> simulateTxFee]', error);
        }

        logger.debug('[COSMOS -> getTransactionFee] SimulateTx not found, Use EstimateFee');
        // EstimateFee to get gas for transaction
        try {
            const estimatedFee = await this.estimateFeeTx(msg);

            if (estimatedFee) return estimatedFee;
        } catch (error) {
            logger.warn('[COSMOS -> getTransactionFee -> estimateFee]', error);
        }

        logger.warn('[COSMOS -> getTransactionFee] Fee not found, Use default fee');

        return null;
    }

    async prepareDelegateTransaction({ fromAddress, toAddress, amount, token, memo }: IPrepareTxCosmos) {
        const fee = this.setDefaultFeeForTx();

        try {
            const { delegate } = cosmos.staking.v1beta1.MessageComposer.withTypeUrl;

            const amountFormatted = utils.parseUnits(amount, token.decimals).toString();

            const msg = delegate({
                amount: {
                    denom: token.base as string,
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

    async prepareMultipleExecuteMsgs({
        fromAddress,
        amount,
        token,
        memo,
        count = 1,
        contract,
        funds = [],
        msgKey = 'mint',
    }: IPrepareMultipleExecuteCosmos) {
        const fee = this.setDefaultFeeForTx();
        const prepareMsgs = () => {
            try {
                const { executeContract } = cosmwasm.wasm.v1.MessageComposer.withTypeUrl;

                const jsonMsg = {
                    [msgKey]: {},
                };

                const contractMsg = toUtf8(JSON.stringify(jsonMsg));

                const msg = executeContract({
                    sender: this.getAccountAddress() as string,
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

    async prepareTransaction({ fromAddress, toAddress, amount, token, memo }: IPrepareTxCosmos) {
        const fee = this.setDefaultFeeForTx();

        try {
            const { send } = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;
            const amountFormatted = utils.parseUnits(amount, token.decimals).toString();

            const msg = send({
                amount: [
                    {
                        denom: token.base as string,
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

    async formatTransactionForSign(transaction: any = {}, params: any = {}) {
        if (!transaction || JSON.stringify(transaction) === '{}')
            return {
                error: 'Transaction not found for sign',
            };

        const response = {
            msg: null,
            fee: this.setDefaultFeeForTx(),
        } as any;

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
            } as any;

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

    async getSignClient(
        RPCs: string[] = [],
        { signingStargate, offlineSigner }: { signingStargate: SigningStargateClient; offlineSigner: OfflineSigner },
    ): Promise<{
        rpc: string | null;
        client: SigningStargateClient | null;
    }> {
        const TIMEOUT_PROMISE = 3000; // 3 seconds for timeout

        // Check if RPCs exist
        if (!RPCs || !RPCs.length) {
            logger.warn('[COSMOS -> getSignClient] RPCs not found to get client');
            return {
                client: null,
                rpc: null,
            };
        }

        // Filter RPCs by ignoreRPC to avoid unnecessary connections
        const filteredRPCs = RPCs.filter((rpc) => !ignoreRPC(rpc));

        // Timeout promise for RPC
        const timeoutFN = (TIMEOUT = TIMEOUT_PROMISE, rpc: string) =>
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`TIMEOUT ${rpc}`)), TIMEOUT);
            });

        const connected = {
            rpc: null,
            client: null,
        } as any;

        for (const rpc of filteredRPCs)
            try {
                const timeoutPromise = timeoutFN(TIMEOUT_PROMISE, rpc);
                const connectPromise = SigningStargateClient.connectWithSigner(rpc, offlineSigner, signingStargate as any);
                await Promise.race([timeoutPromise, connectPromise]);
                console.log('Client connected', rpc);
                connected.rpc = rpc;
                connected.client = await connectPromise;
                return connected;
                // Success
            } catch (error: any) {
                if (error?.message === `TIMEOUT ${rpc}`) {
                    logger.warn(`[COSMOS -> getSignClient TIMEOUT] Timeout connecting to RPC: ${rpc}`);
                    continue; // Try next RPC
                }

                logger.warn(`[COSMOS -> getSignClient] Error connecting to RPC: ${rpc}`, error.message);
                continue; // Try next RPC
            }

        return {
            rpc: null,
            client: null,
        };
    }

    async getSignClientByChain(chain: string) {
        if (!this.walletManager) return null;

        const chainWallet = ref(this.walletManager.getChainWallet(chain, this.walletName as string));
        await chainWallet.value.initOfflineSigner('amino');

        const { rpcEndpoints, chainRecord } = chainWallet.value;
        const { clientOptions = {} } = chainRecord || {};
        const { signingStargate } = clientOptions;

        return (
            (await this.getSignClient(rpcEndpoints as string[], {
                signingStargate: signingStargate as any,
                offlineSigner: chainWallet.value.offlineSigner as OfflineSigner,
            })) || {}
        );
    }

    async signSend(transaction: any) {
        const { msg, fee, memo } = transaction;

        const chainWallet = this._getCurrentWallet();
        if (!chainWallet || !chainWallet.value) return errorRegister('Chain wallet not found');

        const signClient = await this.getSignClientByChain(chainWallet.value.chainRecord.name);

        // Check if client exist
        if (!signClient || !signClient.client)
            return {
                error: 'Signing Stargate client not found',
            };

        // Try to get estimated fee
        try {
            const estimatedFee: any = await this.getTransactionFee(signClient.client, msg);

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

    getExplorer(chainInfo: IChain) {
        const MAIN_EXPLORER = ['mintscan', 'MintScan'];

        if (!chainInfo) return null;

        const { explorers = [] } = chainInfo || {};

        const explorer = explorers.find(({ kind }) => MAIN_EXPLORER.includes(kind as string));

        return explorer || null;
    }

    getTxExplorerLink(txHash: string, chainInfo: IChain): string | null {
        const explorer = this.getExplorer(chainInfo) || {};

        const { tx_page = null } = explorer || {};

        if (!tx_page) return null;

        return tx_page.replace('${txHash}', txHash);
    }

    getTokenExplorerLink(token: string, chainInfo: IChain): string | null {
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

    async getAddressesWithChains(): Promise<IAddressByNetwork | null> {
        const mainAccount = this.getAccount();
        if (!mainAccount) return null;
        if (!this.addressByNetwork) return addressByNetwork();
        if (!this.walletName) return null;
        await this.chainsWithDifferentSlip44(this.walletName);
        return this.addressByNetwork[mainAccount] || {};
    }

    getNativeTokenByChain(chain: string) {
        if (!chain || !this.walletManager) return null;

        const chainInfo = this.walletManager.getChainRecord(chain) as IChainRecord;
        const { assetList } = chainInfo || {};
        const { assets = [] } = assetList;
        const [asset] = assets;

        asset.decimals = asset.denom_units[1].exponent;

        return asset;
    }

    _getTimeoutTimestamp() {
        const PACKET_LIFETIME_NANO = 3600 * 1_000_000_000; // 1 Hour

        const currentTimeNano = Math.floor(Date.now() * 1_000_000);

        return BigNumber(currentTimeNano).plus(PACKET_LIFETIME_NANO).toString();
    }

    private getStargateClientOptionsForChains(chains: Chain[]) {
        const SigningStargateClientOptions = {} as any;

        for (const chainRecord of chains) {
            const stargateClientOptions = {
                aminoTypes,
                registry,
            } as any;

            const { fees } = chainRecord;

            const gasPrice = this.getGasPriceFromChain(fees?.fee_tokens || []);
            if (gasPrice) stargateClientOptions.gasPrice = gasPrice;

            SigningStargateClientOptions[chainRecord.chain_name] = stargateClientOptions;
        }

        return (chain: Chain | string) => {
            const chainName = typeof chain === 'string' ? chain : chain.chain_name;
            if (SigningStargateClientOptions[chainName]) return SigningStargateClientOptions[chainName];
            return void 0;
        };
    }

    private getGasPriceFromChain(feeTokens: ICosmosFeeTokens[]) {
        if (!feeTokens.length) return 0;

        const [feeInfo] = feeTokens;

        const {
            fixed_min_gas_price, // * priority #1: Fixed min gas price
            low_gas_price, // * priority #2: Low gas price
            average_gas_price, // * priority #3: Average gas price
            high_gas_price, // * priority #4: High gas price
            denom, // * Denom for gas price (e.g. uatom, uosmo, etc.)
        } = feeInfo || {};

        const price = fixed_min_gas_price || low_gas_price || average_gas_price || high_gas_price;

        if (!price || !denom) return 0;

        return GasPrice.fromString(`${price}${denom}`);
    }

    private setChainLogos(): void {
        if (!this.walletManager) return logger.warn('[COSMOS] (setChainLogos): WalletManager not found');

        // * Set default logo for chains
        for (const chainRecord of this.walletManager.chainRecords) {
            const cr = chainRecord as IChainRecord;

            const { chain_name, logo_URIs } = cr.chain || {};

            if (!chain_name) {
                logger.warn('[COSMOS] (setChainLogos): Chain name not found');
                continue;
            }

            if (!cr.chain) continue;

            if (this.chainsFromStore[chain_name]) {
                const { svg, png } = logo_URIs || {};
                const logoFromStore = this.chainsFromStore[chain_name]?.logo;
                cr.chain.logo = cr.logo = logoFromStore || svg || png;
            }
        }
    }
}

export default CosmosAdapter.getInstance();
