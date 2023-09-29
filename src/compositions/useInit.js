import { computed } from 'vue';
import { chunk } from 'lodash';

import { getBalancesByAddress } from '@/api/data-provider';

const CHUNK_SIZE = 5;

const COSMOS_CHAIN_ID = {
    cosmoshub: 'cosmos',
};

const RESET_ACTIONS = [
    ['tokens/setLoader', true],
    ['tokens/setFromToken', null],
    ['tokens/setToToken', null],
    ['bridge/setSelectedSrcNetwork', null],
    ['bridge/setSelectedDstNetwork', null],
];

async function performActions(actions, store) {
    await Promise.all(actions.map(([action, payload]) => store.dispatch(action, payload)));
}

const arrayFromObject = (object) => Object.entries(object).map(([key, value]) => ({ chain: key, info: value }));

export default async function useInit(store, { addressesWithChains = {}, account = null } = {}) {
    store.dispatch('tokens/setLoader', true);

    const disableLoader = computed(() => store.getters['tokens/disableLoader']);

    const disableLoaderActions = [['tokens/setDisableLoader', false]];

    const actionsToPerform = disableLoader.value ? disableLoaderActions : RESET_ACTIONS;

    performActions(actionsToPerform, store).catch((error) => {
        console.error('An error occurred:', error);
    });

    let totalBalance = 0;

    const addresses = arrayFromObject(addressesWithChains);
    const chunkedAddresses = chunk(addresses, CHUNK_SIZE);

    const allTokens = [];
    const allIntegrations = [];

    for (const part in chunkedAddresses) {
        for (const { chain, info } of chunkedAddresses[part]) {
            const { logo, address: chainAddress } = info;

            const chainForRequest = COSMOS_CHAIN_ID[chain] || chain;

            const { tokens = [], integrations = [], nfts = [] } = (await getBalancesByAddress(chainForRequest, chainAddress)) || {};

            if (!tokens.length && integrations.length && nfts.length) {
                continue;
            }

            allTokens.push(
                ...tokens.map((token) => {
                    token.id = `${chain}_${chainAddress}_${token.symbol}`;
                    token.chain = chain;
                    token.chainLogo = logo;
                    totalBalance += +token.balanceUsd;
                    return token;
                })
            );

            if (integrations.length) {
                for (const integration of integrations) {
                    integration.balances = integration.balances.map((token) => {
                        token.id = `${chain}_${chainAddress}_${token.symbol}`;
                        token.chainLogo = logo;
                        token.chain = chain;
                        return token;
                    });

                    totalBalance += +integration.balances.reduce((sum, token) => sum + +token.balanceUsd, 0);
                }

                allIntegrations.push(...integrations);
            }

            store.dispatch('tokens/setDataFor', { type: 'tokens', account, data: allTokens });
            store.dispatch('tokens/setDataFor', { type: 'integrations', account, data: allIntegrations });

            store.dispatch('tokens/setTotalBalances', { account, data: totalBalance });

            store.dispatch('tokens/setGroupTokens', { chain, data: { list: tokens } });
        }
    }

    store.dispatch('tokens/setLoader', false);
}
