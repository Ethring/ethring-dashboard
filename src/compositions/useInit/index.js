import { computed } from 'vue';
import _ from 'lodash';

import { ECOSYSTEMS } from '@/Adapter/config';
import { getBalancesByAddress, DP_COSMOS } from '@/api/data-provider';

import BigNumber from 'bignumber.js';

import IndexedDBService from '@/modules/indexedDb';

import { getTotalFuturesBalance, BALANCES_TYPES } from '@/shared/utils/assets';

import { formatRecords, getTotalBalance } from './utils';

// =================================================================================================================

const CHUNK_SIZE = 5;

// =================================================================================================================

const RESET_ACTIONS = [
    ['tokens/setLoader', true],
    ['tokens/setFromToken', null],
    ['tokens/setToToken', null],
    ['bridge/setSelectedSrcNetwork', null],
    ['bridge/setSelectedDstNetwork', null],
];

// =================================================================================================================

async function performActions(actions, store) {
    await Promise.all(actions.map(([action, payload]) => store.dispatch(action, payload)));
}

// =================================================================================================================

const arrayFromObject = (object) => Object.entries(object).map(([key, value]) => ({ chain: key, info: value }));

// =================================================================================================================

const saveOrGetDataFromCache = async (key, data) => {
    const dataExist = Object.keys(data).length;

    if (dataExist) {
        await IndexedDBService.saveData(key, data);
        return data;
    }
    const cachedData = await IndexedDBService.getData(key);

    return cachedData || {};
};

// =================================================================================================================

const integrationsForSave = (integrations, { net, chain, logo, chainAddress }) => {
    let balance = BigNumber(0);

    for (const integration of integrations) {
        integration.balances = formatRecords(integration.balances, { net, chain, chainAddress, logo });

        if (integration.type === BALANCES_TYPES.FUTURES) {
            balance = getTotalFuturesBalance(integration.balances, balance);
        } else {
            balance = getTotalBalance(integration.balances, balance);
        }
    }

    return {
        list: integrations,
        balance,
    };
};

// =================================================================================================================

export default async function useInit(store, { addressesWithChains = {}, account = null, currentChainInfo } = {}) {
    const allTokensForAccount = computed(() => store.getters['tokens/tokens'][account] || []);
    const allTokensBalance = computed(() => store.getters['tokens/totalBalances'][account] || 0);

    if (allTokensForAccount.value.length > 0 && allTokensBalance.value) {
        return store.dispatch('tokens/setLoader', false);
    }

    const disableLoader = computed(() => store.getters['tokens/disableLoader']);

    const disableLoaderActions = [['tokens/setDisableLoader', false]];

    const actionsToPerform = disableLoader.value ? disableLoaderActions : RESET_ACTIONS;

    performActions(actionsToPerform, store).catch((error) => {
        console.error('An error occurred:', error);
    });

    let totalBalance = BigNumber(0);
    let assetsBalance = BigNumber(0);

    const { net: currentChain, ecosystem } = currentChainInfo;

    const addresses = arrayFromObject(addressesWithChains);

    const sortedByCurrChain = _.orderBy(addresses, (item) => (item.chain === currentChain ? 0 : 1), ['asc']);

    const chunkedAddresses = _.chunk(sortedByCurrChain, CHUNK_SIZE);

    for (const { chain } of sortedByCurrChain) {
        const chainForRequest = DP_COSMOS[chain] || chain;
        store.dispatch('tokens/setLoadingByChain', { chain: chainForRequest, value: true });
    }

    const allTokens = [];
    const allIntegrations = [];
    const allNfts = [];

    const progressChunk = async (chunk) => {
        let requests = {};

        for (const { chain, info } of chunk) {
            store.dispatch('tokens/setLoadingByChain', { chain, value: true });

            const { logo, address: chainAddress } = info;

            const chainForRequest = DP_COSMOS[chain] || chain;

            if (ecosystem === ECOSYSTEMS.COSMOS && !DP_COSMOS[chain]) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            // =========================================================================================================

            if (!requests[chainForRequest]) {
                requests[chainForRequest] = await getBalancesByAddress(chainForRequest, chainAddress);
            }

            if (!requests[chainForRequest]) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            // =========================================================================================================

            const {
                tokens = [],
                integrations = [],
                nfts = [],
            } = await saveOrGetDataFromCache(`${account}-${chainForRequest}-${chainAddress}`, requests[chainForRequest]);

            if (!tokens.length && !integrations.length && !nfts.length) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            if (tokens.length) {
                const tokensForSave = formatRecords(tokens, { net: chainForRequest, chain, chainAddress, logo });

                const balance = getTotalBalance(tokensForSave);

                totalBalance = totalBalance.plus(balance);
                assetsBalance = assetsBalance.plus(balance);

                allTokens.push(...tokensForSave);
            }

            if (integrations.length) {
                const { list, balance } = integrationsForSave(integrations, { net: chainForRequest, chain, logo, chainAddress });

                totalBalance = totalBalance.plus(balance);

                allIntegrations.push(...list);
            }

            if (nfts.length) {
                const list = formatRecords(nfts, { chain, logo, chainAddress });

                allNfts.push(...list);
            }

            store.dispatch('tokens/setGroupTokens', { chain, account, data: { list: tokens } });

            store.dispatch('tokens/setDataFor', { type: 'tokens', account, data: allTokens });

            store.dispatch('tokens/setDataFor', { type: 'integrations', account, data: allIntegrations });

            store.dispatch('tokens/setDataFor', { type: 'nfts', account, data: allNfts });

            store.dispatch('tokens/setAssetsBalances', { account, data: assetsBalance.toNumber() });

            store.dispatch('tokens/setTotalBalances', { account, data: totalBalance.toNumber() });

            store.dispatch('tokens/setLoadingByChain', { chain, account, value: false });
        }

        requests = {};
    };

    // Проходим по chunk и обрабатываем их
    for (const part in chunkedAddresses) {
        await progressChunk(chunkedAddresses[part]);
    }

    store.dispatch('tokens/setLoader', false);
}
