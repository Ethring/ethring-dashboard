import WalletInterface from '@/Adapter/utils/WalletInterface';

import * as ethers from 'ethers';
import { init, useOnboard } from '@web3-onboard/vue';

import { web3OnBoardConfig, ECOSYSTEMS, NATIVE_CONTRACT, TRANSFER_ABI } from '@/Adapter/config';

import defaultChains from '@/api/networks/default-chains';

import { validateEthAddress } from '@/Adapter/utils/validations';

let web3Onboard = null;

class EthereumAdapter extends WalletInterface {
    constructor() {
        super();
        this.reInit(defaultChains);
    }

    reInit(chains = defaultChains) {
        web3Onboard = init({ ...web3OnBoardConfig, chains });
    }

    subscribeToWalletsChange() {
        return web3Onboard.state.select('wallets');
    }

    async connectWallet(walletName) {
        const { connectingWallet, connectWallet } = useOnboard();

        if (!walletName) {
            await connectWallet();
            return !connectingWallet.value;
        }

        const connectionOption = {
            autoSelect: {
                label: walletName,
                disableModals: true,
            },
        };

        await connectWallet(connectionOption);

        return !connectingWallet.value;
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

    getAccount() {
        const { connectedWallet } = useOnboard();
        return connectedWallet.value?.accounts[0]?.address;
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

    getChainList(store) {
        return store.getters['networks/zometNetworksList'];
    }

    async setChain(chainInfo) {
        const { chain_id } = chainInfo;
        const { setChain } = useOnboard();

        return await setChain({
            chainId: chain_id,
        });
    }

    getWalletLogo() {
        // const { connectedWallet } = useOnboard();
        // console.log('connected wallet logo', connectedWallet.value, '\n');
        return null;
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
                console.log('pro', fromAddress, toAddress, amount, token);
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
