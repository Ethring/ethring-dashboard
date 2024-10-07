import { computed, ref } from 'vue';
import { ALL_CHAINS_LIST } from '../../../tests/unit/mocks/compositions';
import { WALLET_ADDRESSES, WALLETS } from '../constants';
import { store } from '../../preview';
import useAdapter from '../../../src/core/wallet-adapter/compositions/useAdapter';

const useAdapterMock = () => {
    const walletAddress = ref(WALLET_ADDRESSES.EVM);
    const walletAccount = computed(() => walletAddress.value);
    const currentChainInfo = computed(() => ALL_CHAINS_LIST[0]);
    const chainList = computed(() => ALL_CHAINS_LIST);
    const connectedWallet = ref({
        account: '0xa6209c8c2ddf4cd8d8bbb9df11cd0a7a19e75bdd',
        address: '0xa6209c8c2ddf4cd8d8bbb9df11cd0a7a19e75bdd',
        walletModule: 'Zerion',
        ecosystem: 'EVM',
    });

    const getChainByChainId = (ecosystem: string, chainId: string) => {
        return ALL_CHAINS_LIST.find((chain) => +chain.chain_id === +chainId || chain.net === chainId);
    };

    const setChain = async (chain) => {
        return { chain };
    };

    const getAccountByEcosystem = (ecosystem: string) => {
        return WALLET_ADDRESSES[ecosystem];
    };

    const getConnectedStatus = (ecosystem: string) => {
        return true; // Assuming always connected for mock
    };

    const connectByEcosystems = (ecosystem: string) => {
        console.log(`Storybook mock: Connected to ${ecosystem} wallet`);
    };

    const signSend = async (txData: any) => {
        console.log('Storybook mock: Signing and sending transaction:', txData);
        store.dispatch('txManager/setTxTimerID', null);
        return Promise.resolve({ transactionHash: '0xTxHash' });
    };

    const callTransactionAction = async (action: string, params: any) => {
        console.log(`Storybook mock: callTransactionAction: ${action}`);
        return Promise.resolve(params);
    };

    const getWalletLogo = async (ecosystem: string, module: string) => {
        const wallet = WALLETS.find((elem) => elem.label === module);
        return Promise.resolve(wallet?.icon);
    };

    return {
        ...useAdapter(),
        walletAddress,
        walletAccount,
        currentChainInfo,
        chainList,
        connectedWallet,
        getChainByChainId,
        setChain,
        getAccountByEcosystem,
        getConnectedStatus,
        connectByEcosystems,
        signSend,
        callTransactionAction,
        getWalletLogo,
    };
};

export default useAdapterMock;
