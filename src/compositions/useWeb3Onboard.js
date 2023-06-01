// import '@/config/web3-onboard/init';

// import * as ethers from 'ethers';
import { computed } from 'vue';

import { useOnboard } from '@web3-onboard/vue';

import chainIdNetwork from '@/shared/constants/chains/chainid.network';
import cryptoLogos from '@/shared/constants/chains/crypto.logos';
import citadelNetworks from '@/shared/constants/chains/citadel.networks';

export default function useWeb3Onboard() {
    const { connectedWallet, connectedChain } = useOnboard();

    const currentChainInfo = computed(() => {
        const id = +connectedChain.value?.id;
        const chainInfo = chainIdNetwork.filter(({ chainId }) => chainId === id)[0];

        if (!chainInfo) {
            return {};
        }

        chainInfo.logo = cryptoLogos[id] || '';
        chainInfo.citadelNet = citadelNetworks[id] || '';

        return chainInfo;
    });

    const walletAddress = computed(() => connectedWallet.value?.accounts[0]?.address);

    const walletBalance = computed(() => {
        if (connectedWallet.value?.accounts[0]?.balance) {
            return Object.entries(connectedWallet.value?.accounts[0]?.balance)[0];
        }
        return [];
    });

    const walletIcon = computed(() => connectedWallet.value?.icon);

    return {
        walletAddress,
        walletBalance,
        walletIcon,
        currentChainInfo,
        ...useOnboard(),
    };
}

// import { chainNamespaceValidation, chainIdValidation, chainValidation, validate, weiToEth, ProviderRpcErrorCode } from '@web3-onboard/common';

// async function updateBalances(addresses) {
//     const { wallets, chains } = state.get();
//     const updatedWallets = await Promise.all(wallets.map(async (wallet) => {
//         const chain = chains.find(({ id }) => id === wallet.chains[0].id);
//         const updatedAccounts = await Promise.all(wallet.accounts.map(async (account) => {
//             const secondaryTokens = await updateSecondaryTokens(wallet, account.address, chain);
//             // if no provided addresses, we want to update all balances
//             // otherwise check if address is in addresses array
//             if (!addresses ||
//                 addresses.some(address => address.toLowerCase() === account.address.toLowerCase())) {
//                 const updatedBalance = await getBalance(account.address, chain);
//                 return { ...account, balance: updatedBalance, secondaryTokens };
//             }
//             return { ...account, secondaryTokens };
//         }));
//         return { ...wallet, accounts: updatedAccounts };
//     }));
//     updateAllWallets(updatedWallets);
// }

// const updateSecondaryTokens = async (wallet, account, chain) => {
//     const chainRPC = chain.rpcUrl;
//     if (!chain.secondaryTokens || !chain.secondaryTokens.length || !chainRPC)
//         return;
//     const ethersProvider = new ethers.providers.Web3Provider(wallet.provider, 'any');
//     const signer = ethersProvider.getSigner();
//     const erc20ABISubset = [
//         {
//             inputs: [{ name: 'owner', type: 'address' }],
//             name: 'balanceOf',
//             outputs: [{ name: '', type: 'uint256' }],
//             stateMutability: 'view',
//             type: 'function'
//         },
//         {
//             inputs: [],
//             name: 'symbol',
//             outputs: [{ name: '', type: 'string' }],
//             stateMutability: 'view',
//             type: 'function'
//         }
//     ];
//     const tokenBalances = await Promise.all(chain.secondaryTokens.map(async (token) => {
//         try {
//             const swapContract = new ethers.Contract(token.address, erc20ABISubset, signer);
//             const bigNumBalance = await swapContract.balanceOf(account);
//             const tokenName = await swapContract.symbol();
//             return {
//                 name: tokenName,
//                 balance: weiToEth(bigNumBalance.toHexString()),
//                 icon: token.icon
//             };
//         }
//         catch (error) {
//             console.error(`There was an error fetching balance and/or symbol
//           for token contract: ${token.address} - ${error}`);
//         }
//     }));
//     return tokenBalances;
// };

// async function getBalance(address, chain) {
//     // chain we don't recognize and don't have a rpcUrl for requests
//     if (!chain)
//         return null;
//     const { wallets } = state.get();
//     try {
//         const wallet = wallets.find(wallet => !!wallet.provider);
//         const provider = wallet.provider;
//         const balanceHex = await provider.request({
//             method: 'eth_getBalance',
//             params: [address, 'latest']
//         });
//         return balanceHex ? { [chain.token || 'eth']: weiToEth(balanceHex) } : null;
//     }
//     catch (error) {
//         console.error(error);
//         return null;
//     }
// }
