import WalletInterface from '@/Adapter/utils/WalletInterface';

import { init, useOnboard } from '@web3-onboard/vue';

// import web3OnBoardConfig from '@/Adapter/config/web3-onboard';
import { web3OnBoardConfig, ECOSYSTEMS } from '@/Adapter/config';

import defaultChains from '@/api/networks/default-chains';

let web3Onboard = null;

class EthereumAdapter extends WalletInterface {
    constructor(chains = defaultChains) {
        super();
        web3Onboard = init({ ...web3OnBoardConfig, chains });
    }

    subscribeToWalletsChange() {
        return web3Onboard.state.select('wallets');
        // const wallets = web3Onboard.state.select('wallets');
        // wallets.subscribe(() => {
        //     this.getAccount();
        // });
        // unsubscribe when updates are no longer needed
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

    getWalletLogo() {
        // const { connectedWallet } = useOnboard();
        // console.log('connected wallet logo', connectedWallet.value, '\n');
        return null;
    }
}

export default new EthereumAdapter();
