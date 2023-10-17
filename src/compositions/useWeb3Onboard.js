import { computed } from 'vue';

import { init, useOnboard } from '@web3-onboard/vue';

import { web3OnBoardConfig } from '@/Adapter/config';

import chainIdNetwork from '@/shared/constants/chains/chainid.network';
import cryptoLogos from '@/shared/constants/chains/crypto.logos';
import networks from '@/shared/constants/chains/citadel.networks';
import defaultChains from '@/api/networks/default-chains';

let web3Onboard = null;

const initWeb3 = (chains = defaultChains) => (web3Onboard = init({ ...web3OnBoardConfig, chains }));

const setUniqueDataQA = (DOM) => {
    const walletConnectItems = DOM.querySelectorAll('.wallet-button-container');

    if (!walletConnectItems) {
        return;
    }

    return walletConnectItems.forEach((item) => {
        const name = item.querySelector('.name').innerHTML;
        item.setAttribute('data-qa', name);
    });
};

const setEventToActionBtn = (DOM) => {
    const connectWallet = DOM.querySelector('.action-container');

    if (!connectWallet) {
        return;
    }

    return connectWallet.addEventListener('click', () => setTimeout(() => setUniqueDataQA(DOM)));
};

export default function useWeb3Onboard() {
    if (!web3Onboard) {
        return initWeb3();
    }

    const onBoardDOM = document.querySelector('onboard-v2').shadowRoot;

    const state = web3Onboard.state.select('accountCenter');

    if (onBoardDOM) {
        state.subscribe(() => {
            setTimeout(() => setEventToActionBtn(onBoardDOM));
        });

        setTimeout(() => setUniqueDataQA(onBoardDOM));
    }

    const { connectedWallet, connectedChain } = useOnboard();

    const currentChainInfo = computed(() => {
        const id = +connectedChain.value?.id;
        const chainInfo = chainIdNetwork.filter(({ chainId }) => chainId === id)[0];

        if (!chainInfo) {
            return {};
        }

        chainInfo.logo = cryptoLogos[id] || '';
        chainInfo.net = networks[id] || '';

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

export { initWeb3 };
