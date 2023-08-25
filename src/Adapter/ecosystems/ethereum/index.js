/* eslint-disable no-unused-vars */

import AdapterBase from '@/Adapter/utils/AdapterBase';

import * as ethers from 'ethers';
import { init, useOnboard } from '@web3-onboard/vue';

import { web3OnBoardConfig, ECOSYSTEMS, NATIVE_CONTRACT, TRANSFER_ABI } from '@/Adapter/config';

import { validateEthAddress } from '@/Adapter/utils/validations';

let web3Onboard = null;

const STORAGE = {
    WALLET: 'onboard.js:last_connected_wallet',
};

class EthereumAdapter extends AdapterBase {
    constructor() {
        super();
    }

    reInit(chains) {
        !web3Onboard && (web3Onboard = init({ ...web3OnBoardConfig, chains }));
    }

    subscribeToWalletsChange() {
        return web3Onboard.state.select('wallets');
    }

    async connectWallet(walletName) {
        const { connectedWallet, connectWallet } = useOnboard();

        if (!walletName) {
            await connectWallet();
            return connectedWallet.value;
        }

        const connectionOption = {
            autoSelect: {
                label: walletName,
                disableModals: true,
            },
        };

        await connectWallet(connectionOption);

        return connectedWallet.value;
    }

    async disconnectWallet(label) {
        const { disconnectWallet } = useOnboard();

        return await disconnectWallet(label);
    }

    async disconnectAllWallets() {
        const { disconnectConnectedWallet } = useOnboard();

        return await disconnectConnectedWallet();
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
            return store.getters['networks/networkByChainId'](chainId);
        };

        const chainInfo = chainFromStore(+connectedChain.value?.id);
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
        return store.getters['networks/zometNetworksList'];
    }

    async setChain(chainInfo) {
        const { chain_id, chain } = chainInfo;
        const { setChain } = useOnboard();

        const id = chain_id || chain;

        return await setChain({
            chainId: id,
        });
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

    validateAddress(...args) {
        return validateEthAddress(...args);
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

    async prepareTransaction(fromAddress, toAddress, amount, token) {
        const ethersProvider = this.getProvider();

        try {
            if (ethersProvider) {
                const contractAddress = token?.address || NATIVE_CONTRACT;
                const tokenContract = new ethers.Contract(contractAddress, TRANSFER_ABI, ethersProvider);

                const res = await tokenContract.populateTransaction.transfer(toAddress, ethers.utils.parseUnits(amount, token.decimals));

                const value = !token?.address ? ethers.utils.parseEther(amount.value) : ethers.utils.parseUnits('0');
                const nonce = await ethersProvider.getTransactionCount(fromAddress);

                return {
                    ...res,
                    from: fromAddress,
                    value,
                    nonce,
                };
            }
        } catch (e) {
            return { error: e?.data?.message || e.message };
        }
    }

    async signSend(transaction) {
        const ethersProvider = this.getProvider();

        try {
            if (ethersProvider) {
                const signer = ethersProvider.getSigner();

                const txn = await signer.sendTransaction(transaction);

                const receipt = await txn.wait();
                return receipt;
            }
        } catch (e) {
            return { error: e?.data?.message || e.message };
        }
    }
}

export default new EthereumAdapter();
