import { computed } from 'vue';

import { ethers } from 'ethers';

import useWeb3Onboard from '@/compositions/useWeb3Onboard';
import useTokens from '@/compositions/useTokens';

export default function useWalletManager() {
    const { currentChainInfo, walletAddress, disconnectConnectedWallet, connectedWallet, connectWallet, setChain } = useWeb3Onboard();

    const { groupTokens } = useTokens();

    const walletBalance = computed(() => {
        const currentWallet = groupTokens.value.find((elem) => elem?.net === currentChainInfo.value.net);
        return {
            price: currentWallet?.price,
            balance: currentWallet?.balance.mainBalance,
            code: currentWallet?.code,
            balanceUsd: currentWallet?.balance.mainBalance * currentWallet?.price.USD,
        };
    });

    const connectedService = computed(() => {
        return 'Blocknative';
    });

    const changeNetwork = async (chainId) => {
        await setChain({
            chainId,
        });
    };

    const disconnectAllWallets = () => {
        disconnectConnectedWallet();
    };

    const connectAnotherWallet = () => {
        connectWallet();
    };

    const connectBlocknative = () => {
        connectWallet();
    };

    const connectCosmology = () => {
        console.log('---connectCosmology');
    };

    const getProvider = () => {
        const { provider } = connectedWallet.value || {};
        if (provider) {
            const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');
            return ethersProvider;
        }
    };

    const signTransaction = async (transaction) => {
        const ethersProvider = getProvider();
        const tx = {
            data: transaction.data,
            from: transaction.from,
            to: transaction.to,
            chainId: `0x${transaction?.chainId?.toString(16)}`,
            value: transaction.value ? `0x${parseInt(transaction.value).toString(16)}` : '0x0',
        };
        try {
            if (ethersProvider) {
                const signer = ethersProvider.getSigner();
                const txn = await signer.sendTransaction(tx);

                const receipt = await txn.wait();

                return receipt;
            }
        } catch (e) {
            return { error: e.message };
        }
    };

    return {
        currentChainInfo,
        walletBalance,
        connectedWallet,
        walletAddress,
        connectedService,

        disconnectAllWallets,
        connectAnotherWallet,
        connectBlocknative,
        connectCosmology,
        signTransaction,
        changeNetwork,
    };
}
