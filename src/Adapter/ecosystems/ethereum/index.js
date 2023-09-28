/* eslint-disable no-unused-vars */

import AdapterBase from '@/Adapter/utils/AdapterBase';

import * as ethers from 'ethers';

import { init, useOnboard } from '@web3-onboard/vue';

import { web3OnBoardConfig, ECOSYSTEMS, NATIVE_CONTRACT, TRANSFER_ABI, EVM_CHAINS } from '@/Adapter/config';

import { validateEthAddress } from '@/Adapter/utils/validations';

import { checkErrors } from '@/helpers/checkErrors';

let web3Onboard = null;

// const STORAGE = {
//     WALLET: 'onboard.js:last_connected_wallet',
// };

class EthereumAdapter extends AdapterBase {
    constructor() {
        super();
        !web3Onboard && (web3Onboard = init({ ...web3OnBoardConfig }));

        web3Onboard.state.select('wallets').subscribe(() => this.setAddressForChains());
    }

    subscribeToWalletsChange() {
        return web3Onboard.state.select('wallets');
    }

    async connectWallet(walletName) {
        const { connectWallet, connectingWallet } = useOnboard();

        const connectionOption = {
            autoSelect: {
                label: walletName,
                disableModals: true,
            },
        };
        try {
            await connectWallet(walletName ? connectionOption : null);

            if (!connectingWallet.value) {
                this.setAddressForChains();
            }

            return !connectingWallet.value;
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

            const { net } = chainInfo || {};

            if (!this.addressByNetwork[net]) {
                this.addressByNetwork[net] = null;
            }

            this.addressByNetwork[net] = {
                address: mainAddress,
                logo: chainInfo.logo,
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
        const { disconnectConnectedWallet } = useOnboard();

        try {
            await disconnectConnectedWallet();
            this.addressByNetwork = {};
        } catch (error) {
            console.error('Error while disconnect all wallets', error);
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

        try {
            return await setChain({
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

    formatTransactionForSign(transaction) {
        if (typeof transaction.chainId === 'number') {
            transaction.chainId = `0x${transaction.chainId.toString(16)}`;
        }

        transaction.value = transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0';

        return transaction;
    }

    async prepareTransaction(fromAddress, toAddress, amount, token) {
        const ethersProvider = this.getProvider();

        try {
            if (ethersProvider) {
                const contractAddress = token?.address || NATIVE_CONTRACT;
                const tokenContract = new ethers.Contract(contractAddress, TRANSFER_ABI, ethersProvider);

                const res = await tokenContract.populateTransaction.transfer(toAddress, ethers.utils.parseUnits(amount, token.decimals));

                const value = !token?.address ? ethers.utils.parseEther(amount) : ethers.utils.parseUnits('0');

                const nonce = await ethersProvider.getTransactionCount(fromAddress);

                return {
                    ...res,
                    from: fromAddress,
                    value,
                    nonce,
                };
            }
        } catch (e) {
            return checkErrors(e);
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
            return checkErrors(e);
        }
    }

    getTxExplorerLink(txHash, chainInfo) {
        const { explorers } = chainInfo || {};
        const [explorer] = explorers || [];

        return `${explorer}/tx/${txHash}`;
    }

    getAddressesWithChains() {
        return this.addressByNetwork || {};
    }
}

export default new EthereumAdapter();
