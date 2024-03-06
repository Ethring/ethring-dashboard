/* eslint-disable no-unused-vars */

import AdapterBase from '@/Adapter/utils/AdapterBase';

import * as ethers from 'ethers';

import { init, useOnboard } from '@web3-onboard/vue';

import { web3OnBoardConfig, ECOSYSTEMS, chainConfig, NATIVE_CONTRACT, TRANSFER_ABI, EVM_CHAINS } from '@/Adapter/config';

import { validateEthAddress } from '@/Adapter/utils/validations';

import { errorRegister } from '@/shared/utils/errors';
import _ from 'lodash';

let web3Onboard = null;

const STORAGE = {
    WALLET: 'onboard.js:last_connected_wallet',
};

const [DEFAULT_CHAIN] = chainConfig;

class EthereumAdapter extends AdapterBase {
    constructor() {
        super();
        !web3Onboard && (web3Onboard = init({ ...web3OnBoardConfig }));

        web3Onboard.state.select('wallets').subscribe(() => this.setAddressForChains());
    }

    subscribeToWalletsChange() {
        return web3Onboard.state.select('wallets');
    }

    unsubscribeToWalletsChange() {
        console.log('Unsubscribe to wallets change', 'ethereum');
        return web3Onboard.state.select('wallets').unsubscribe();
    }

    async connectWallet(walletName) {
        const { connectWallet, connectedWallet } = useOnboard();

        const connectionOption = {
            autoSelect: {
                label: walletName,
                disableModals: true,
            },
        };

        try {
            await connectWallet(walletName ? connectionOption : null);
            const { wallets = [] } = web3Onboard.state.get() || {};

            if (wallets.length) {
                this.setAddressForChains();
            }

            return {
                isConnected: !!wallets.length,
                walletName: connectedWallet.value?.label || null,
            };
        } catch (error) {
            console.error('Failed to connect to:', walletName, error);
            return false;
        }
    }

    setAddressForChains() {
        if (!this.addressByNetwork) {
            this.addressByNetwork = {};
        }

        const { chains } = web3Onboard.state.get();
        const mainAddress = this.getAccountAddress();

        if (!mainAddress) {
            return null;
        }

        for (const { id } of chains) {
            if (!id) {
                continue;
            }

            const chainInfo = EVM_CHAINS[+id] || {};

            if (!chainInfo) {
                continue;
            }

            const { net, logo } = chainInfo || {};

            if (!this.addressByNetwork[net]) {
                this.addressByNetwork[net] = null;
            }

            this.addressByNetwork[net] = {
                address: mainAddress,
                logo,
            };
        }
    }

    async disconnectWallet(label) {
        const { disconnectWallet } = useOnboard();

        try {
            console.log('Disconnecting from', label);
            await disconnectWallet({ label });
            this.addressByNetwork = {};
        } catch (error) {
            console.error(`Error while disconnect from ${label}`, error);
        }
    }

    async disconnectAllWallets() {
        const { disconnectConnectedWallet, disconnectWallet } = useOnboard();

        try {
            await disconnectConnectedWallet();
            this.addressByNetwork = {};
        } catch (error) {
            console.error('Error while disconnect all wallets', error);
        }

        // Disconnect wallets from store

        const walletsFromStore = window.localStorage.getItem(STORAGE.WALLET) || null;
        const wallets = walletsFromStore ? JSON.parse(walletsFromStore) : [];

        if (!wallets.length) {
            return;
        }

        try {
            for (const wallet of wallets) {
                await disconnectWallet({ label: wallet });
            }
        } catch (error) {
            console.error('Error while disconnect wallets from store', error);
        }
    }

    getMainWallets() {
        return [];
    }

    getWalletModule() {
        const { connectedWallet } = useOnboard();
        const { label = null } = connectedWallet.value || {};
        return label;
    }

    getAccount() {
        return this.getAccountAddress();
    }

    getAccountAddress() {
        const { connectedWallet } = useOnboard();
        const [primaryAccount] = connectedWallet.value?.accounts || [];
        return primaryAccount?.address;
    }

    getCurrentChain(store) {
        const { connectedWallet, connectedChain } = useOnboard();
        const { label = null } = connectedWallet.value || {};

        const chainFromStore = (chainId) => {
            if (!store?.getters) {
                return {};
            }
            return store.getters['configs/getChainConfigByChainId'](chainId, ECOSYSTEMS.EVM);
        };

        const { id = null } = connectedChain.value || {};

        if (!id && isNaN(+id)) {
            return null;
        }

        const chainInfo = chainFromStore(+id);

        if (JSON.stringify(chainInfo) === '{}') {
            chainInfo.chain_id = id;
        }

        chainInfo.walletName = chainInfo.walletModule = label;
        chainInfo.ecosystem = ECOSYSTEMS.EVM;

        return chainInfo;
    }

    getConnectedWallet() {
        const connectedWallet = {
            account: this.getAccount(),
            address: this.getAccountAddress(),
            walletModule: this.getWalletModule(),
            ecosystem: ECOSYSTEMS.EVM,
        };

        return connectedWallet || null;
    }

    getChainList(store) {
        const chains = store.getters['configs/getConfigsListByEcosystem'](ECOSYSTEMS.EVM) || [];

        for (const chain of chains) {
            chain.walletName = this.getWalletModule();
            chain.ecosystem = ECOSYSTEMS.EVM;
        }

        return chains;
    }

    async setChain(chainInfo) {
        const { chain_id, chain } = chainInfo;

        const id = chain_id || chain;

        try {
            return await web3Onboard.setChain({
                chainId: id,
            });
        } catch (error) {
            console.log('Failed to set chain', error);
            return false;
        }
    }

    async getWalletLogo(walletModule) {
        if (!walletModule) {
            return null;
        }

        const { walletModules } = web3Onboard.state.get() || {};
        const exist = walletModules.find((module) => module.label === walletModule);

        if (!exist) {
            return null;
        }

        return (await exist.getIcon()) || null;
    }

    validateAddress(address, { validation }) {
        return validateEthAddress(address, validation);
    }

    getProvider() {
        const { connectedWallet } = useOnboard();
        const { provider } = connectedWallet.value || {};

        if (!provider) {
            return null;
        }

        const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

        return ethersProvider;
    }

    async formatTransactionForSign(transaction) {
        if (typeof transaction.chainId === 'number') {
            transaction.chainId = `0x${transaction.chainId.toString(16)}`;
        }

        if (typeof transaction.gasPrice === 'string') {
            transaction.gasPrice = `0x${parseInt(transaction.gasPrice).toString(16)}`;
        }

        if (typeof transaction.nonce === 'number') {
            const ethersProvider = this.getProvider();
            transaction.nonce = await ethersProvider.getTransactionCount(transaction.from);
        }

        if (['number', 'string'].includes(typeof transaction.gas)) {
            transaction.gasLimit = `0x${parseInt(transaction.gas).toString(16)}`; // TODO: Check if it's necessary
            delete transaction.gas;
        }

        transaction.value = transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0';

        if (!transaction?.data?.startsWith('0x')) {
            transaction.data = `0x${transaction.data}`;
        }

        return transaction;
    }

    async prepareTransaction({ fromAddress, toAddress, amount, token }) {
        const ethersProvider = this.getProvider();

        try {
            if (ethersProvider) {
                const value = !token?.address ? ethers.utils.parseEther(amount) : ethers.utils.parseUnits('0');

                const nonce = await ethersProvider.getTransactionCount(fromAddress);

                const contractAddress = token?.address;

                const response = {
                    from: fromAddress,
                    to: toAddress,
                    value,
                    nonce,
                };

                if (!contractAddress) {
                    return response;
                }

                const tokenContract = new ethers.Contract(contractAddress, TRANSFER_ABI, ethersProvider);

                const res = await tokenContract.populateTransaction.transfer(toAddress, ethers.utils.parseUnits(amount, token.decimals));

                return {
                    ...response,
                    ...res,
                };
            }
        } catch (e) {
            return errorRegister(e);
        }
    }

    async signSend(transaction) {
        const ethersProvider = this.getProvider();

        try {
            if (ethersProvider) {
                const signer = ethersProvider.getSigner();

                const txn = await signer.sendTransaction(transaction);

                const { hash } = txn;

                return {
                    transactionHash: hash,
                    ...txn,
                };
            }
        } catch (e) {
            return errorRegister(e);
        }
    }

    getTxExplorerLink(txHash, chainInfo) {
        const { explorers } = chainInfo || {};
        const [explorer] = explorers || [];

        return `${explorer}/tx/${txHash}`;
    }

    getTokenExplorerLink(tokenAddress, chainInfo) {
        const { explorers } = chainInfo || {};
        const [explorer] = explorers || [];

        return `${explorer}/token/${tokenAddress}`;
    }

    async getAddressesWithChains() {
        return this.addressByNetwork || {};
    }

    getNativeTokenByChain(chain, store) {
        const isLoadingConfig = store.getters['configs/isConfigLoading'];

        if (isLoadingConfig) {
            return setTimeout(() => {
                return this.getNativeTokenByChain(chain, store);
            }, 1000);
        }

        const chainsInfo = store.getters['configs/getConfigsByEcosystems'](ECOSYSTEMS.EVM);

        return chainsInfo.evm[chain] || null;
    }
}

export default new EthereumAdapter();
