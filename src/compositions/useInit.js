import { computed } from 'vue';
import _ from 'lodash';

import { getBalancesByAddress } from '@/api/data-provider';
import BigNumber from 'bignumber.js';

import IndexedDBService from '@/modules/indexedDb';

const CHUNK_SIZE = 5;

const COSMOS_CHAIN_ID = {
    cosmoshub: 'cosmos',
};
// =================================================================================================================

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

const formatRecords = (records, { chain, chainAddress, logo }) => {
    for (const record of records) {
        record.id = `${chain}_${chainAddress}_${record.code}`;
        record.chainLogo = logo;
        record.chain = chain;
    }

    return records;
};

const getTotalBalance = (records, totalBalance) => {
    const totalSum = records.reduce((acc, token) => {
        return acc.plus(+token.balanceUsd || 0);
    }, BigNumber(0));

    totalBalance = totalBalance.plus(totalSum);

    return totalBalance;
};

const integrationsForSave = (integrations, { chain, logo, chainAddress }) => {
    let balance = BigNumber(0);

    for (const integration of integrations) {
        integration.balances = formatRecords(integration.balances, { chain, chainAddress, logo });
        balance = getTotalBalance(integration.balances, balance);
    }

    return {
        list: integrations,
        balance,
    };
};

// =================================================================================================================

export default async function useInit(store, { addressesWithChains = {}, account = null, currentChainInfo } = {}) {
    store.dispatch('tokens/setLoader', true);

    const disableLoader = computed(() => store.getters['tokens/disableLoader']);

    const disableLoaderActions = [['tokens/setDisableLoader', false]];

    const actionsToPerform = disableLoader.value ? disableLoaderActions : RESET_ACTIONS;

    performActions(actionsToPerform, store).catch((error) => {
        console.error('An error occurred:', error);
    });

    let totalBalance = BigNumber(0);

    const { net: currentChain } = currentChainInfo;

    const addresses = arrayFromObject(addressesWithChains);

    const sortedByCurrChain = _.orderBy(addresses, [(record) => (record.chain === currentChain ? 0 : 1)]);

    const chunkedAddresses = _.chunk(sortedByCurrChain, CHUNK_SIZE);

    const allTokens = [];
    const allIntegrations = [];

    const progressChunk = async (chunk) => {
        for (const { chain, info } of chunk) {
            store.dispatch('tokens/setLoadingByChain', { chain, value: true });

            const { logo, address: chainAddress } = info;

            const chainForRequest = COSMOS_CHAIN_ID[chain] || chain;

            const response = (await getBalancesByAddress(chainForRequest, chainAddress)) || {};

            const {
                tokens = [],
                integrations = [],
                nfts = [],
            } = await saveOrGetDataFromCache(`${account}-${chainForRequest}-${chainAddress}`, response);

            if (!tokens.length && integrations.length && nfts.length) {
                store.dispatch('tokens/setLoadingByChain', { chain, value: false });
                continue;
            }

            if (tokens.length) {
                const tokensForSave = formatRecords(tokens, { chain, chainAddress, logo });

                totalBalance = getTotalBalance(tokensForSave, totalBalance);

                allTokens.push(...tokensForSave);
            }

            if (integrations.length) {
                const { list, balance } = integrationsForSave(integrations, { chain, logo, chainAddress });

                totalBalance = totalBalance.plus(balance);

                allIntegrations.push(...list);
            }

            store.dispatch('tokens/setGroupTokens', { chain, data: { list: tokens } });

            store.dispatch('tokens/setDataFor', { type: 'tokens', account, data: allTokens });

            store.dispatch('tokens/setDataFor', { type: 'integrations', account, data: allIntegrations });

            store.dispatch('tokens/setTotalBalances', { account, data: totalBalance.toFixed(2) });

            store.dispatch('tokens/setLoadingByChain', { chain, value: false });
        }
    };

    // Проходим по chunk и обрабатываем их
    for (const part in chunkedAddresses) {
        await progressChunk(chunkedAddresses[part]);
    }

    store.dispatch('tokens/setLoader', false);
}
